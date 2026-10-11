"use server";

import type { IImage } from "@/types";
import { getCurrentUserId, getOwnedQuestion, getOwnedQuiz, userOwnsGroup } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryImages } from "@/lib/cloudinary";

function stringValue(values: { [key: string]: FormDataEntryValue }, key: string): string {
  const value = values[key];
  return typeof value === "string" ? value.trim() : "";
}

function actionError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2002") return "A record with these details already exists.";
  console.error("Quiz action failed:", error);
  return "Something went wrong. Please try again.";
}

function validateQuizInputs(userInputs: string[]): string | null {
  if (!Array.isArray(userInputs) || userInputs.length > 20) return "A quiz can have at most 20 participant fields.";
  if (userInputs.some((input) => typeof input !== "string" || !input.trim() || input.trim().length > 80)) {
    return "Participant field names must be between 1 and 80 characters.";
  }
  return null;
}

function validateQuizImages(images: IImage[]): string | null {
  if (!Array.isArray(images) || images.length > 2) return "A quiz can have at most two cover images.";
  const keys = new Set<string>();
  for (const image of images) {
    if (!image || !["left", "right"].includes(image.key) || keys.has(image.key)) {
      return "Cover images must use one unique left slot and one unique right slot.";
    }
    keys.add(image.key);
    if (!image.publicId || image.publicId.length > 500 || !image.url || image.url.length > 2048) {
      return "One or more uploaded images are invalid. Upload them again.";
    }
    try {
      const url = new URL(image.url);
      if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
        return "Cover images must come from the configured Cloudinary account.";
      }
    } catch {
      return "One or more uploaded image URLs are invalid.";
    }
  }
  return null;
}

export const publishQuizDB = async ({ quizId }: { quizId: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getOwnedQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const data = await prisma.quiz.update({ where: { id: quizId }, data: { published: true } });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const unPublishQuizDB = async ({ quizId }: { quizId: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getOwnedQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const data = await prisma.quiz.update({ where: { id: quizId }, data: { published: false } });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const getQuizDB = async ({ id }: { id: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getOwnedQuiz(id, userId))) return { ok: false, error: "Quiz not found or access denied." };

    // Do not load all participants just to render the quiz editor. Their results
    // are fetched separately when the Participants tab is opened.
    const data = await prisma.quiz.findUnique({
      where: { id },
      include: { images: true, questions: { include: { options: true } } },
    });
    if (!data) return { ok: false, error: "Quiz not found." };
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const createQuizDB = async (
  values: { [k: string]: FormDataEntryValue },
  {
    author: _clientAuthor,
    groupId,
    userInputs,
    images,
    isStrictMode,
    translation,
  }: {
    author: string;
    groupId: string;
    userInputs: string[];
    images: IImage[];
    isStrictMode: boolean;
    translation: { enable: boolean; sourceLanguage: string; targetLanguage: string };
  },
) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await userOwnsGroup(groupId, userId))) return { ok: false, error: "Group not found or access denied." };

    const title = stringValue(values, "title");
    const duration = Number(stringValue(values, "duration"));
    const maxMarks = Number(stringValue(values, "maxMarks"));
    if (!title) return { ok: false, error: "Quiz title is required." };
    if (!Number.isInteger(duration) || duration < 1) return { ok: false, error: "Duration must be a positive whole number." };
    if (!Number.isInteger(maxMarks) || maxMarks < 1) return { ok: false, error: "Maximum marks must be a positive whole number." };
    const inputError = validateQuizInputs(userInputs);
    if (inputError) return { ok: false, error: inputError };
    const imageError = validateQuizImages(images);
    if (imageError) return { ok: false, error: imageError };

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const data = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          title,
          desc: stringValue(values, "desc"),
          userInputs: [...new Set(userInputs.map((input) => input.trim()))],
          duration,
          maxMarks,
          footerHeading1: stringValue(values, "footerHeading1"),
          footerHeading2: stringValue(values, "footerHeading2"),
          footerText1: stringValue(values, "footerText1"),
          footerText2: stringValue(values, "footerText2"),
          footerLink: stringValue(values, "footerLink"),
          author: currentUser?.name || "Quizvera admin",
          groupId,
          isStrictMode: Boolean(isStrictMode),
          translationEnabled: Boolean(translation.enable),
          sourceLanguage: translation.enable ? translation.sourceLanguage || "en" : null,
          targetLanguage: translation.enable ? translation.targetLanguage || "hi" : null,
        },
      });

      const validImages = images.filter((image) => image.publicId && image.url);
      if (validImages.length) {
        await tx.image.createMany({
          data: validImages.map((image) => ({
            key: image.key,
            url: image.url,
            publicId: image.publicId!,
            quizId: quiz.id,
          })),
        });
      }

      return tx.quiz.findUnique({ where: { id: quiz.id }, include: { images: true, questions: true } });
    });

    return { ok: true, data };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "A quiz with this title already exists in this group." };
    return { ok: false, error: actionError(error) };
  }
};

export const updateQuizDB = async (
  values: { [k: string]: FormDataEntryValue },
  {
    quizId,
    userInputs,
    images,
    isStrictMode,
    translation,
  }: {
    quizId: string;
    userInputs: string[];
    images: IImage[];
    isStrictMode: boolean;
    translation: { enable: boolean; sourceLanguage: string; targetLanguage: string };
  },
) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getOwnedQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const title = stringValue(values, "title");
    const duration = Number(stringValue(values, "duration"));
    const maxMarks = Number(stringValue(values, "maxMarks"));
    if (!title) return { ok: false, error: "Quiz title is required." };
    if (!Number.isInteger(duration) || duration < 1) return { ok: false, error: "Duration must be a positive whole number." };
    if (!Number.isInteger(maxMarks) || maxMarks < 1) return { ok: false, error: "Maximum marks must be a positive whole number." };
    const inputError = validateQuizInputs(userInputs);
    if (inputError) return { ok: false, error: inputError };
    const imageError = validateQuizImages(images);
    if (imageError) return { ok: false, error: imageError };

    const previousImages = await prisma.image.findMany({ where: { quizId }, select: { publicId: true } });
    const retainedPublicIds = new Set(images.map((image) => image.publicId).filter((value): value is string => Boolean(value)));

    const data = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.update({
        where: { id: quizId },
        data: {
          title,
          desc: stringValue(values, "desc"),
          userInputs: [...new Set(userInputs.map((input) => input.trim()))],
          duration,
          maxMarks,
          isStrictMode: Boolean(isStrictMode),
          translationEnabled: Boolean(translation.enable),
          sourceLanguage: translation.enable ? translation.sourceLanguage || "en" : null,
          targetLanguage: translation.enable ? translation.targetLanguage || "hi" : null,
          footerHeading1: stringValue(values, "footerHeading1"),
          footerHeading2: stringValue(values, "footerHeading2"),
          footerText1: stringValue(values, "footerText1"),
          footerText2: stringValue(values, "footerText2"),
          footerLink: stringValue(values, "footerLink"),
        },
      });

      // Always replace the image rows, including when the user removes all images.
      await tx.image.deleteMany({ where: { quizId: quiz.id } });
      const validImages = images.filter((image) => image.publicId && image.url);
      if (validImages.length) {
        await tx.image.createMany({
          data: validImages.map((image) => ({
            key: image.key,
            url: image.url,
            publicId: image.publicId!,
            quizId: quiz.id,
          })),
        });
      }

      return tx.quiz.findUnique({ where: { id: quiz.id }, include: { images: true, questions: { include: { options: true } } } });
    });

    const removedPublicIds = previousImages
      .map((image) => image.publicId)
      .filter((publicId) => !retainedPublicIds.has(publicId));
    const cleanup = await deleteCloudinaryImages(removedPublicIds);
    if (!cleanup.ok) console.error("Quiz updated, but Cloudinary cleanup failed:", cleanup.error);

    return { ok: true, data, warning: cleanup.ok ? undefined : "Quiz saved, but an old cover image could not be deleted." };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "A quiz with this title already exists in this group." };
    return { ok: false, error: actionError(error) };
  }
};

export const deleteQuizDB = async ({ quizId }: { quizId: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getOwnedQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const images = await prisma.image.findMany({ where: { quizId }, select: { publicId: true } });
    const data = await prisma.quiz.delete({ where: { id: quizId } });
    const cleanup = await deleteCloudinaryImages(images.map((image) => image.publicId));
    if (!cleanup.ok) console.error("Quiz deleted, but Cloudinary cleanup failed:", cleanup.error);
    return { ok: true, data, warning: cleanup.ok ? undefined : "Quiz deleted, but an associated image could not be removed from storage." };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const addQuestionDB = async ({
  title,
  translatedTitle,
  showSnippet,
  snippet,
  snippetLang,
  answer,
  options,
  quizId,
}: {
  title: string;
  translatedTitle: string;
  showSnippet: boolean;
  snippet: string;
  snippetLang: string;
  answer: string;
  options: { key: string; value: string; translatedValue: string }[];
  quizId: string;
}) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getOwnedQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };
    if (!title?.trim() || title.trim().length > 10000) return { ok: false, error: "Question text must be between 1 and 10,000 characters." };
    if (!Array.isArray(options) || options.length !== 4 || options.some((option) => typeof option.value !== "string" || !option.value.trim() || option.value.length > 4000)) {
      return { ok: false, error: "Provide four answer options, each no longer than 4,000 characters." };
    }
    if (new Set(options.map((option) => option.key)).size !== 4 || ["a", "b", "c", "d"].some((key) => !options.some((option) => option.key === key))) {
      return { ok: false, error: "Option keys must be a, b, c, and d." };
    }
    if (!["a", "b", "c", "d"].includes(answer)) return { ok: false, error: "Select a valid correct answer." };
    if (Boolean(showSnippet) && ((snippet ?? "").length > 20000 || (snippetLang ?? "").length > 40)) return { ok: false, error: "Code snippet or language is too long." };
    if ((translatedTitle ?? "").length > 10000 || options.some((option) => (option.translatedValue ?? "").length > 4000)) return { ok: false, error: "Translated content is too long." };

    const data = await prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          title: title.trim(), translatedTitle: translatedTitle || null, showSnippet,
          snippet: showSnippet ? snippet || null : null,
          snippetLang: showSnippet ? snippetLang || null : null,
          answer, quizId,
        },
      });
      await tx.option.createMany({
        data: options.map((option) => ({
          key: option.key,
          value: option.value.trim(),
          translatedValue: option.translatedValue || null,
          questionId: question.id,
        })),
      });
      const createdOptions = await tx.option.findMany({ where: { questionId: question.id }, orderBy: { key: "asc" } });
      return { ...question, options: createdOptions };
    });

    return { ok: true, data };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "Duplicate answer options are not allowed." };
    return { ok: false, error: actionError(error) };
  }
};

export const updateQuestionDB = async ({
  questionId,
  title,
  translatedTitle,
  showSnippet,
  snippet,
  snippetLang,
  answer,
  options,
}: {
  questionId: string;
  title: string;
  translatedTitle: string;
  showSnippet: boolean;
  snippet: string;
  snippetLang: string;
  answer: string;
  options: { id: string; key: string; value: string; translatedValue: string }[];
}) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const ownedQuestion = await getOwnedQuestion(questionId, userId);
    if (!ownedQuestion) return { ok: false, error: "Question not found or access denied." };
    if (!title?.trim() || title.trim().length > 10000) return { ok: false, error: "Question text must be between 1 and 10,000 characters." };
    if (!Array.isArray(options) || options.length !== 4 || options.some((option) => typeof option.value !== "string" || !option.value.trim() || option.value.length > 4000)) {
      return { ok: false, error: "Provide four answer options, each no longer than 4,000 characters." };
    }
    if (new Set(options.map((option) => option.key)).size !== 4 || ["a", "b", "c", "d"].some((key) => !options.some((option) => option.key === key))) {
      return { ok: false, error: "Option keys must be a, b, c, and d." };
    }
    if (!["a", "b", "c", "d"].includes(answer)) return { ok: false, error: "Select a valid correct answer." };
    if (Boolean(showSnippet) && ((snippet ?? "").length > 20000 || (snippetLang ?? "").length > 40)) return { ok: false, error: "Code snippet or language is too long." };
    if ((translatedTitle ?? "").length > 10000 || options.some((option) => (option.translatedValue ?? "").length > 4000)) return { ok: false, error: "Translated content is too long." };

    const data = await prisma.$transaction(async (tx) => {
      const currentOptions = await tx.option.findMany({ where: { questionId }, select: { id: true, key: true } });
      const currentIds = new Set(currentOptions.map((option) => option.id));
      if (options.length !== currentOptions.length || options.some((option) => !currentIds.has(option.id))) {
        throw new Error("Invalid options for this question.");
      }

      const question = await tx.question.update({
        where: { id: questionId },
        data: {
          title: title.trim(), translatedTitle: translatedTitle || null, showSnippet,
          snippet: showSnippet ? snippet || null : null,
          snippetLang: showSnippet ? snippetLang || null : null,
          answer,
        },
      });
      const updatedOptions = await Promise.all(options.map((option) => tx.option.update({
        where: { id: option.id },
        data: { value: option.value.trim(), translatedValue: option.translatedValue || null },
      })));
      return { ...question, options: updatedOptions.sort((a, b) => a.key.localeCompare(b.key)) };
    });

    return { ok: true, data };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "Duplicate answer options are not allowed." };
    if (error instanceof Error && error.message === "Invalid options for this question.") {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: actionError(error) };
  }
};

export const deleteQuestionDB = async ({ questionId }: { questionId: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getOwnedQuestion(questionId, userId))) return { ok: false, error: "Question not found or access denied." };

    const data = await prisma.question.delete({ where: { id: questionId } });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const getQuizParticipantsDB = async ({ quizId }: { quizId: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getOwnedQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const participants = await prisma.quizParticipant.findMany({
      where: { quizId },
      orderBy: { createdAt: "desc" },
      include: {
        User: { select: { id: true, name: true, email: true, phone: true } },
        // Fetch answer identifiers first. A manually deleted question can leave
        // legacy orphaned answers in MongoDB and break a required relation join.
        Answers: { select: { id: true, answer: true, questionId: true, quizParticipantId: true } },
        QuizInputs: true,
      },
    });

    const questionIds = Array.from(new Set(participants.flatMap((participant) => participant.Answers.map((answer) => answer.questionId))));
    const questionRows = questionIds.length
      ? await prisma.question.findMany({ where: { id: { in: questionIds }, quizId }, select: { id: true, answer: true } })
      : [];
    const answerKeyById = new Map(questionRows.map((question) => [question.id, question.answer]));

    const data = participants.map((participant) => ({
      ...participant,
      Answers: participant.Answers.map((answer) => ({
        ...answer,
        Question: answerKeyById.has(answer.questionId) ? { answer: answerKeyById.get(answer.questionId)! } : null,
      })),
    }));

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};
