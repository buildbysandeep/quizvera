"use server";

import { getAccessibleQuiz, getCurrentUserId, getOwnedQuiz, userOwnsGroup } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { slugifyQuizTitle } from "@/lib/quiz-slug";

function actionError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2002") return "A record with these details already exists.";
  console.error("Collaboration action failed:", error);
  return "Something went wrong. Please try again.";
}

async function createUniqueQuizSlug(title: string): Promise<string> {
  const base = slugifyQuizTitle(title);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${base.slice(0, Math.max(1, 80 - suffix.length))}${suffix}`;
    const existing = await prisma.quiz.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  return `${base.slice(0, 58)}-${Date.now().toString(36)}`;
}

export async function getQuizAdminsDB({ quizId }: { quizId: string }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        group: { select: { adminId: true, admin: { select: { id: true, name: true, email: true } } } },
        collaborators: {
          orderBy: { createdAt: "asc" },
          select: { id: true, userId: true, createdAt: true, User: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!quiz) return { ok: false, error: "Quiz not found." };
    return {
      ok: true,
      data: {
        mainAdmin: quiz.group.admin,
        collaborators: quiz.collaborators.map((collaborator) => ({
          id: collaborator.id,
          userId: collaborator.userId,
          name: collaborator.User.name,
          email: collaborator.User.email,
          createdAt: collaborator.createdAt,
        })),
        canManage: quiz.group.adminId === userId,
      },
    };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}

export async function addQuizAdminDB({ quizId, email }: { quizId: string; email: string }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const ownedQuiz = await getOwnedQuiz(quizId, userId);
    if (!ownedQuiz) return { ok: false, error: "Only the primary admin can manage quiz access." };
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return { ok: false, error: "Enter a valid Quizvera account email." };
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });
    if (!user) return { ok: false, error: "No Quizvera account exists for that email. Ask them to register first." };
    if (user.id === userId) return { ok: false, error: "You are already the primary admin of this quiz." };

    await prisma.quizCollaborator.create({ data: { quizId, userId: user.id, addedById: userId } });
    return { ok: true, data: user };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "This user already has access to the quiz." };
    return { ok: false, error: actionError(error) };
  }
}

export async function removeQuizAdminDB({ quizId, collaboratorUserId }: { quizId: string; collaboratorUserId: string }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const ownedQuiz = await getOwnedQuiz(quizId, userId);
    if (!ownedQuiz) return { ok: false, error: "Only the primary admin can manage quiz access." };
    if (collaboratorUserId === ownedQuiz.mainAdminId) {
      return { ok: false, error: "The primary admin who created this quiz cannot be removed." };
    }
    const deleted = await prisma.quizCollaborator.deleteMany({ where: { quizId, userId: collaboratorUserId } });
    if (deleted.count === 0) return { ok: false, error: "That collaborator no longer has access." };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}

export async function moveQuizToGroupDB({ quizId, groupId }: { quizId: string; groupId: string }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const quiz = await getOwnedQuiz(quizId, userId);
    if (!quiz) return { ok: false, error: "Only the primary admin can move this quiz." };
    if (!(await userOwnsGroup(groupId, userId))) return { ok: false, error: "Choose a group that belongs to your account." };
    if (quiz.groupId === groupId) return { ok: true, unchanged: true };

    await prisma.$transaction(async (tx) => {
      await tx.quiz.update({ where: { id: quizId }, data: { groupId } });
      // Keep participant records attached to the group that now contains the quiz.
      await tx.quizParticipant.updateMany({ where: { quizId }, data: { groupId } });
    });
    return { ok: true, groupId };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "That group already has a quiz with this title." };
    return { ok: false, error: actionError(error) };
  }
}

export async function duplicateQuizDB({ quizId, groupId, title }: { quizId: string; groupId: string; title: string }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };
    if (!(await userOwnsGroup(groupId, userId))) return { ok: false, error: "Choose a group that belongs to your account." };

    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length > 160)
      return { ok: false, error: "Quiz title must be between 1 and 160 characters." };
    const [source, currentUser] = await Promise.all([
      prisma.quiz.findUnique({
        where: { id: quizId },
        include: { images: true, questions: { include: { options: true } } },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);
    if (!source) return { ok: false, error: "Source quiz not found." };

    const slug = await createUniqueQuizSlug(cleanTitle);
    const duplicate = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          slug,
          title: cleanTitle,
          desc: source.desc,
          duration: source.duration,
          maxMarks: source.maxMarks,
          userInputs: source.userInputs,
          isStrictMode: source.isStrictMode,
          translationEnabled: source.translationEnabled,
          sourceLanguage: source.sourceLanguage,
          targetLanguage: source.targetLanguage,
          footerHeading1: source.footerHeading1,
          footerHeading2: source.footerHeading2,
          footerText1: source.footerText1,
          footerText2: source.footerText2,
          footerLink: source.footerLink,
          author: currentUser?.name || "Quizvera admin",
          groupId,
          published: false,
        },
      });

      if (source.images.length) {
        await tx.image.createMany({
          data: source.images.map((image) => ({
            key: image.key,
            url: image.url,
            publicId: image.publicId,
            quizId: quiz.id,
          })),
        });
        for (const image of source.images) {
          await tx.userImage.upsert({
            where: { userId_publicId: { userId, publicId: image.publicId } },
            update: { url: image.url },
            create: { userId, publicId: image.publicId, url: image.url },
          });
        }
      }

      for (const question of source.questions) {
        await tx.question.create({
          data: {
            title: question.title,
            translatedTitle: question.translatedTitle,
            showSnippet: question.showSnippet,
            snippet: question.snippet,
            snippetLang: question.snippetLang,
            answer: question.answer,
            quizId: quiz.id,
            options: {
              create: question.options.map((option) => ({
                key: option.key,
                value: option.value,
                translatedValue: option.translatedValue,
              })),
            },
          },
        });
      }
      return { id: quiz.id, slug: quiz.slug, title: quiz.title, groupId: quiz.groupId };
    });
    return { ok: true, data: duplicate };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "A quiz with that title already exists in the selected group." };
    return { ok: false, error: actionError(error) };
  }
}

export async function getSharedQuizzesDB() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const shared = await prisma.quizCollaborator.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        Quiz: {
          select: {
            id: true,
            slug: true,
            title: true,
            desc: true,
            published: true,
            createdAt: true,
            groupId: true,
            group: { select: { name: true, admin: { select: { name: true, email: true } } } },
            _count: { select: { questions: true, participants: true } },
          },
        },
      },
    });
    return {
      ok: true,
      data: shared.map((item) => ({
        ...item.Quiz,
        ownerName: item.Quiz.group.admin.name || item.Quiz.group.admin.email,
        groupName: item.Quiz.group.name,
      })),
    };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}

export async function getMyParticipatedQuizzesDB() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const account = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!account?.email) return { ok: true, data: [] };
    const normalizedEmail = account.email.trim().toLowerCase();
    const attempts = await prisma.quizParticipant.findMany({
      where: { OR: [{ userId }, { participantEmail: normalizedEmail }] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        quizId: true,
        createdAt: true,
        isQualified: true,
        anyReason: true,
        Quiz: {
          select: {
            id: true,
            slug: true,
            title: true,
            desc: true,
            duration: true,
            published: true,
            createdAt: true,
            group: { select: { name: true } },
            _count: { select: { questions: true } },
          },
        },
      },
    });
    const seen = new Set<string>();
    const data = attempts.flatMap((attempt) => {
      if (seen.has(attempt.quizId)) return [];
      seen.add(attempt.quizId);
      return [
        {
          participantId: attempt.id,
          quizId: attempt.quizId,
          participatedAt: attempt.createdAt,
          isQualified: attempt.isQualified,
          statusReason: attempt.anyReason,
          ...attempt.Quiz,
          groupName: attempt.Quiz.group.name,
          questionCount: attempt.Quiz._count.questions,
        },
      ];
    });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}

export async function getMyQuizResultDB({ slug }: { slug: string }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const account = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!account?.email) return { ok: false, error: "Your account has no email address." };
    const normalizedEmail = account.email.trim().toLowerCase();
    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        desc: true,
        duration: true,
        maxMarks: true,
        questions: {
          select: {
            id: true,
            title: true,
            snippet: true,
            snippetLang: true,
            options: { select: { id: true, key: true, value: true } },
          },
        },
      },
    });
    if (!quiz) return { ok: false, error: "Quiz history not found." };
    const attempt = await prisma.quizParticipant.findFirst({
      where: { quizId: quiz.id, OR: [{ userId }, { participantEmail: normalizedEmail }] },
      orderBy: { createdAt: "desc" },
      include: {
        Answers: { select: { id: true, answer: true, questionId: true } },
        QuizInputs: { select: { key: true, value: true } },
      },
    });
    if (!attempt) return { ok: false, error: "You have not participated in this quiz with your account email." };
    const questionIds = quiz.questions.map((question) => question.id);
    const answerRows = questionIds.length
      ? await prisma.question.findMany({
          where: { id: { in: questionIds }, quizId: quiz.id },
          select: { id: true, answer: true },
        })
      : [];
    const correctById = new Map(answerRows.map((question) => [question.id, question.answer]));
    const answersById = new Map(attempt.Answers.map((answer) => [answer.questionId, answer.answer]));
    const questions = quiz.questions.map((question) => ({
      ...question,
      correctAnswer: correctById.get(question.id) ?? null,
      selectedAnswer: answersById.get(question.id) ?? null,
      isCorrect: answersById.has(question.id) && answersById.get(question.id) === correctById.get(question.id),
    }));
    const correctCount = questions.filter((question) => question.isCorrect).length;
    return {
      ok: true,
      data: {
        slug: quiz.slug,
        title: quiz.title,
        desc: quiz.desc,
        duration: quiz.duration,
        maxMarks: quiz.maxMarks,
        participantName: attempt.participantName || undefined,
        participantEmail: attempt.participantEmail || account.email,
        createdAt: attempt.createdAt,
        isQualified: attempt.isQualified,
        statusReason: attempt.anyReason,
        correctCount,
        attemptedCount: attempt.Answers.length,
        questionCount: quiz.questions.length,
        score: quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * (quiz.maxMarks || 100)) : 0,
        percentage: quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * 100) : 0,
        questions,
        inputs: attempt.QuizInputs,
      },
    };
  } catch (cause) {
    console.error("Load participant quiz result failed:", cause);
    return { ok: false, error: "Could not load your quiz result." };
  }
}

export async function deleteQuizParticipantDB({ quizId, participantId }: { quizId: string; participantId: string }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };
    const participant = await prisma.quizParticipant.findFirst({
      where: { id: participantId, quizId },
      select: { id: true, userId: true },
    });
    if (!participant) return { ok: false, error: "Participant not found." };

    await prisma.$transaction(async (tx) => {
      await tx.participantQuizAnswer.deleteMany({ where: { quizParticipantId: participant.id } });
      await tx.quizInput.deleteMany({ where: { quizParticipantId: participant.id } });
      await tx.quizParticipant.delete({ where: { id: participant.id } });

      const guest = await tx.user.findUnique({
        where: { id: participant.userId },
        select: { id: true, email: true, passwordHash: true, googleId: true },
      });
      if (guest?.email.endsWith("@participants.quizvera.invalid") && !guest.passwordHash && !guest.googleId) {
        const remainingAttempts = await tx.quizParticipant.count({ where: { userId: guest.id } });
        if (remainingAttempts === 0) await tx.user.delete({ where: { id: guest.id } });
      }
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}
