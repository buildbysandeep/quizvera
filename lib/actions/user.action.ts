"use server";

import { prisma } from "@/lib/prisma";
import { createGuestIdentity, createQuizAttemptToken, verifyQuizAttemptToken } from "@/lib/quiz-attempt-token";
import { evaluateQuizAvailability } from "@/lib/quiz-availability";

type SubmittedAnswer = { questionId: string; answer: string };
type SubmittedQuizInput = { key: string; value: string };

export const userRegDB = async ({
  name,
  email,
  phone,
  quizId,
}: {
  quizId: string;
  name: string;
  email: string;
  phone: string;
}) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedPhone = phone.replace(/\D/g, "");

    if (!normalizedName || normalizedName.length > 120) return { ok: false, error: "Enter a valid name." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return { ok: false, error: "Enter a valid email address." };
    }
    if (!/^\d{10}$/.test(normalizedPhone)) return { ok: false, error: "Enter a valid 10-digit phone number." };
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
      return { ok: false, error: "Quiz registration is temporarily unavailable. Please contact the administrator." };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        slug: true,
        published: true,
        groupId: true,
        createdAt: true,
        publishedAt: true,
        availabilityMode: true,
        availabilityDurationMinutes: true,
        availabilityStartedAt: true,
        availabilityStartsAt: true,
        availabilityEndsAt: true,
      },
    });
    if (!quiz) return { ok: false, error: "This quiz is no longer available." };
    const availability = evaluateQuizAvailability(quiz);
    if (availability.status !== "active") {
      if (availability.status === "expired" && quiz.published && availability.expiredReason !== "unpublished") {
        await prisma.quiz.update({ where: { id: quiz.id }, data: { published: false } }).catch(() => undefined);
      }
      return {
        ok: false,
        error:
          availability.status === "waiting"
            ? "This quiz has not opened yet."
            : "This quiz is no longer accepting submissions.",
        redirectTo: availability.status === "expired" ? `/share/quiz/${quiz.slug || quizId}/expired` : undefined,
      };
    }

    // Check both new snapshot identities and legacy participant rows.
    let existing = await prisma.quizParticipant.findFirst({
      where: { quizId, participantEmail: normalizedEmail },
      select: { isQualified: true },
    });
    if (!existing) {
      const legacyUser = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      if (legacyUser) {
        existing = await prisma.quizParticipant.findUnique({
          where: { userId_quizId: { userId: legacyUser.id, quizId } },
          select: { isQualified: true },
        });
      }
    }
    if (existing?.isQualified) {
      return { ok: true, isSubmitted: true, message: "You have already submitted this quiz." };
    }
    if (existing) return { ok: true, isDisqualified: true };

    // Public registrations use a deterministic guest identity, never an
    // existing account keyed only by an email supplied in the browser.
    const guest = createGuestIdentity(quizId, normalizedEmail);
    const user = await prisma.user.upsert({
      where: { id: guest.id },
      update: { name: normalizedName, phone: normalizedPhone },
      create: {
        id: guest.id,
        name: normalizedName,
        email: guest.email,
        phone: normalizedPhone,
        passwordHash: null,
        isOnBoarded: true,
      },
      select: { id: true },
    });

    const attemptToken = createQuizAttemptToken({
      userId: user.id,
      quizId,
      groupId: quiz.groupId,
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    return {
      ok: true,
      data: { id: user.id, name: normalizedName, email: normalizedEmail, phone: normalizedPhone },
      attemptToken,
    };
  } catch (cause) {
    console.error("Public quiz registration failed:", cause);
    return { ok: false, error: "Unable to register for this quiz. Please try again." };
  }
};

export const submitParticipantQuizDB = async ({
  userId,
  attemptToken,
  quizId,
  groupId,
  answers = [],
  quizInputs = [],
  isQualified,
  reason,
}: {
  userId: string;
  attemptToken: string;
  quizId: string;
  groupId: string;
  answers?: SubmittedAnswer[];
  quizInputs?: SubmittedQuizInput[];
  isQualified: boolean;
  reason?: string;
}) => {
  try {
    const claims = verifyQuizAttemptToken(attemptToken);
    if (!claims || claims.userId !== userId || claims.quizId !== quizId || claims.groupId !== groupId) {
      return { ok: false, error: "Your quiz session is invalid or expired. Please register again." };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        slug: true,
        groupId: true,
        published: true,
        duration: true,
        userInputs: true,
        createdAt: true,
        publishedAt: true,
        availabilityMode: true,
        availabilityDurationMinutes: true,
        availabilityStartedAt: true,
        availabilityStartsAt: true,
        availabilityEndsAt: true,
        questions: { select: { id: true, options: { select: { key: true } } } },
      },
    });

    if (!quiz) return { ok: false, error: "Quiz not found." };
    const availability = evaluateQuizAvailability(quiz);
    const sharedDeadline = availability.endAt ? new Date(availability.endAt).getTime() : null;
    const sharedDeadlineGrace = Boolean(
      availability.status === "expired" &&
      (availability.expiredReason === "timer" || availability.expiredReason === "schedule") &&
      sharedDeadline !== null &&
      claims.iat < sharedDeadline &&
      Date.now() <= sharedDeadline + 30_000,
    );
    if (availability.status !== "active" && !sharedDeadlineGrace) {
      if (availability.status === "expired" && quiz.published && availability.expiredReason !== "unpublished") {
        await prisma.quiz.update({ where: { id: quiz.id }, data: { published: false } }).catch(() => undefined);
      }
      return {
        ok: false,
        error:
          availability.status === "waiting"
            ? "The quiz has not started yet."
            : "This quiz is no longer accepting submissions.",
        redirectTo:
          availability.status === "expired"
            ? `/share/quiz/${quiz.slug || quizId}/expired`
            : `/share/quiz/${quiz.slug || quizId}`,
      };
    }
    if (quiz.groupId !== groupId) return { ok: false, error: "Invalid quiz group." };
    if (!Array.isArray(answers) || !Array.isArray(quizInputs)) return { ok: false, error: "Invalid submission payload." };
    if (answers.length > quiz.questions.length || quizInputs.length > 20)
      return { ok: false, error: "Submission contains too much data." };
    if (typeof isQualified !== "boolean" || (reason != null && (typeof reason !== "string" || reason.length > 500))) {
      return { ok: false, error: "Invalid submission status." };
    }
    if (
      answers.some(
        (answer) =>
          !answer || typeof answer.questionId !== "string" || typeof answer.answer !== "string" || answer.answer.length > 20,
      )
    ) {
      return { ok: false, error: "Submission contains an invalid answer." };
    }
    if (quizInputs.some((input) => !input || typeof input.key !== "string" || typeof input.value !== "string")) {
      return { ok: false, error: "Submission contains an invalid participant field." };
    }
    if (
      quiz.userInputs.some(
        (key) => !quizInputs.some((input) => input.key === key && typeof input.value === "string" && input.value.trim()),
      )
    ) {
      if (isQualified) return { ok: false, error: "Please fill all participant information fields." };
    }

    // The client timer is only a convenience. Enforce the configured deadline
    // on the server too, with a short delivery grace for network latency.
    const participantTimedOut = Boolean(
      isQualified && !reason && quiz.duration && Date.now() > claims.iat + quiz.duration * 60_000 + 30_000,
    );
    const timedOut = Boolean(participantTimedOut || sharedDeadlineGrace);
    const finalQualified = Boolean(isQualified && !reason && !timedOut);
    const finalReason = sharedDeadlineGrace
      ? "Quiz availability ended"
      : reason?.trim() || (timedOut ? "Time limit exceeded" : null);

    const questionById = new Map(quiz.questions.map((question) => [question.id, question]));
    const seenQuestionIds = new Set<string>();
    for (const answer of answers) {
      const question = questionById.get(answer.questionId);
      if (!question || seenQuestionIds.has(answer.questionId))
        return { ok: false, error: "Submission contains an invalid or duplicate question." };
      if (!question.options.some((option) => option.key === answer.answer))
        return { ok: false, error: "Submission contains an invalid answer option." };
      seenQuestionIds.add(answer.questionId);
    }

    const validInputNames = new Set(quiz.userInputs);
    const seenInputKeys = new Set<string>();
    for (const input of quizInputs) {
      if (!validInputNames.has(input.key) || seenInputKeys.has(input.key) || typeof input.value !== "string") {
        return { ok: false, error: "Submission contains an invalid participant field." };
      }
      if (input.value.length > 500) return { ok: false, error: "Participant field values are too long." };
      seenInputKeys.add(input.key);
    }

    await prisma.$transaction(async (tx) => {
      const participant = await tx.quizParticipant.create({
        data: {
          userId: claims.userId,
          quizId,
          groupId: quiz.groupId,
          participantName: claims.name,
          participantEmail: claims.email,
          participantPhone: claims.phone,
          isQualified: finalQualified,
          anyReason: finalReason,
        },
      });

      const nonEmptyInputs = quizInputs.filter((input) => input.value.trim());
      if (nonEmptyInputs.length) {
        await tx.quizInput.createMany({
          data: nonEmptyInputs.map((input) => ({
            key: input.key,
            value: input.value.trim(),
            quizParticipantId: participant.id,
          })),
        });
      }

      if (answers.length) {
        await tx.participantQuizAnswer.createMany({
          data: answers.map((answer) => ({
            answer: answer.answer,
            questionId: answer.questionId,
            quizParticipantId: participant.id,
          })),
        });
      }
    });

    return {
      ok: true,
      message: timedOut ? "The time limit was reached; your recorded answers were saved." : "Quiz submitted successfully",
      timedOut,
    };
  } catch (cause) {
    const code = (cause as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "You have already submitted this quiz." };
    console.error("Quiz submission failed:", cause);
    return { ok: false, error: "Something went wrong while saving your submission." };
  }
};

export const getQuizParticipantsDB = async ({ quizId }: { quizId: string }) => {
  // Imported lazily to keep this function's authorization check close to the
  // database query and avoid exposing participant records to another folder.
  try {
    const { getCurrentUserId, getAccessibleQuiz } = await import("@/lib/authorization");
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const participants = await prisma.quizParticipant.findMany({
      where: { quizId },
      orderBy: { createdAt: "desc" },
      include: {
        User: { select: { id: true, name: true, email: true, phone: true } },
        Answers: { select: { id: true, answer: true, questionId: true, quizParticipantId: true } },
        QuizInputs: true,
      },
    });

    const questionIds = Array.from(
      new Set(participants.flatMap((participant) => participant.Answers.map((answer) => answer.questionId))),
    );
    const questionRows = questionIds.length
      ? await prisma.question.findMany({ where: { id: { in: questionIds }, quizId }, select: { id: true, answer: true } })
      : [];
    const answerKeyById = new Map(questionRows.map((question) => [question.id, question.answer]));
    const data = participants.map((participant) => ({
      ...participant,
      User: {
        ...participant.User,
        name: participant.participantName ?? participant.User.name,
        email: participant.participantEmail ?? participant.User.email,
        phone: participant.participantPhone ?? participant.User.phone,
      },
      Answers: participant.Answers.map((answer) => ({
        ...answer,
        Question: answerKeyById.has(answer.questionId) ? { answer: answerKeyById.get(answer.questionId)! } : null,
      })),
    }));

    return { ok: true, data };
  } catch (error) {
    console.error("Fetch quiz participants failed:", error);
    return { ok: false, error: "Could not load quiz participants." };
  }
};
