"use server";

import type { IImage } from "@/types";
import { getCurrentUserId, getAccessibleQuestion, getAccessibleQuiz, getOwnedQuiz, userOwnsGroup } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { slugifyQuizTitle } from "@/lib/quiz-slug";
import { evaluateQuizAvailability } from "@/lib/quiz-availability";

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


async function createUniqueQuizSlug(title: string, exceptQuizId?: string): Promise<string> {
  const base = slugifyQuizTitle(title);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${base.slice(0, Math.max(1, 80 - suffix.length))}${suffix}`;
    const existing = await prisma.quiz.findFirst({
      where: { slug: candidate, ...(exceptQuizId ? { id: { not: exceptQuizId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${base.slice(0, 58)}-${Date.now().toString(36)}`;
}

export const getQuizBySlugDB = async ({ slug }: { slug: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    let data = await prisma.quiz.findUnique({
      where: { slug },
      include: {
        images: true,
        questions: { include: { options: true } },
        group: { select: { name: true, adminId: true, admin: { select: { id: true, name: true, email: true } } } },
        collaborators: { select: { userId: true } },
        _count: { select: { participants: true } },
      },
    });
    // Redirect old slugs after a title rename to the current canonical slug.
    if (!data) {
      data = await prisma.quiz.findFirst({
        where: { previousSlugs: { has: slug } },
        include: {
          images: true,
          questions: { include: { options: true } },
          group: { select: { name: true, adminId: true, admin: { select: { id: true, name: true, email: true } } } },
          collaborators: { select: { userId: true } },
          _count: { select: { participants: true } },
        },
      });
    }
    // Legacy URL compatibility: old bookmarks used ObjectIds as path segments.
    if (!data && /^[a-f0-9]{24}$/i.test(slug)) {
      const legacy = await prisma.quiz.findUnique({ where: { id: slug } });
      if (legacy) {
        const stableSlug = legacy.slug || await createUniqueQuizSlug(legacy.title, legacy.id);
        data = await prisma.quiz.update({ where: { id: legacy.id }, data: { slug: stableSlug }, include: {
          images: true,
          questions: { include: { options: true } },
          group: { select: { name: true, adminId: true, admin: { select: { id: true, name: true, email: true } } } },
          collaborators: { select: { userId: true } },
          _count: { select: { participants: true } },
        } });
      }
    }
    if (!data) return { ok: false, error: "Quiz not found." };
    const access = await getAccessibleQuiz(data.id, userId);
    if (!access) return { ok: false, error: "Quiz not found or access denied." };
    if (!data.slug) {
      const stableSlug = await createUniqueQuizSlug(data.title, data.id);
      data = await prisma.quiz.update({ where: { id: data.id }, data: { slug: stableSlug }, include: {
        images: true,
        questions: { include: { options: true } },
        group: { select: { name: true, adminId: true, admin: { select: { id: true, name: true, email: true } } } },
        collaborators: { select: { userId: true } },
        _count: { select: { participants: true } },
      } });
    }
    const availability = evaluateQuizAvailability(data);
    if (data.published && availability.status === "expired" && availability.expiredReason !== "unpublished") {
      await prisma.quiz.update({ where: { id: data.id }, data: { published: false } });
      data = { ...data, published: false };
    }
    return { ok: true, data: { ...data, participantCount: data._count?.participants ?? 0, mainAdminId: data.group.adminId, groupName: data.group.name,
      isMainAdmin: data.group.adminId === userId, isCollaborator: data.collaborators.some((c) => c.userId === userId),
      legacyRedirectSlug: slug !== data.slug ? data.slug : undefined } };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const getQuizSlugByIdDB = async ({ id }: { id: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const access = await getAccessibleQuiz(id, userId);
    if (!access) return { ok: false, error: "Quiz not found or access denied." };
    const quiz = await prisma.quiz.findUnique({ where: { id }, select: { id: true, title: true, slug: true } });
    if (!quiz) return { ok: false, error: "Quiz not found." };
    const slug = quiz.slug || await createUniqueQuizSlug(quiz.title, quiz.id);
    if (!quiz.slug) await prisma.quiz.update({ where: { id }, data: { slug } });
    return { ok: true, slug };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const updateQuizAvailabilityDB = async ({
  quizId,
  mode,
  durationMinutes,
  startsAt,
  endsAt,
}: {
  quizId: string;
  mode: "ALWAYS" | "PUBLISH_TIMER" | "MANUAL_TIMER" | "FIXED_WINDOW";
  durationMinutes?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    if (!["ALWAYS", "PUBLISH_TIMER", "MANUAL_TIMER", "FIXED_WINDOW"].includes(mode)) {
      return { ok: false, error: "Choose a valid availability mode." };
    }
    const duration = durationMinutes == null || durationMinutes === 0 ? null : Number(durationMinutes);
    if (mode === "PUBLISH_TIMER" && (!Number.isInteger(duration) || Number(duration) < 1 || Number(duration) > 10080)) {
      return { ok: false, error: "Set an auto-close duration between 1 minute and 7 days." };
    }
    if (mode === "MANUAL_TIMER" && duration !== null && (!Number.isInteger(duration) || Number(duration) < 1 || Number(duration) > 10080)) {
      return { ok: false, error: "Duration must be between 1 minute and 7 days, or leave it empty for manual closing." };
    }

    let scheduledStart: Date | null = null;
    let scheduledEnd: Date | null = null;
    if (mode === "FIXED_WINDOW") {
      scheduledStart = startsAt ? new Date(startsAt) : null;
      scheduledEnd = endsAt ? new Date(endsAt) : null;
      if (!scheduledStart || !scheduledEnd || !Number.isFinite(scheduledStart.getTime()) || !Number.isFinite(scheduledEnd.getTime())) {
        return { ok: false, error: "Choose both a start and an end date/time." };
      }
      if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
        return { ok: false, error: "The end time must be after the start time." };
      }
      if (scheduledEnd.getTime() <= Date.now()) {
        return { ok: false, error: "The end time must be in the future." };
      }
    }

    const current = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { availabilityMode: true, availabilityStartedAt: true, published: true },
    });
    if (!current) return { ok: false, error: "Quiz not found." };

    const now = new Date();
    const availabilityStartedAt = mode === "MANUAL_TIMER"
      ? (current.availabilityMode === mode ? current.availabilityStartedAt : null)
      : mode === "PUBLISH_TIMER"
        ? (current.availabilityMode === mode ? current.availabilityStartedAt : (current.published ? now : null))
        : null;

    const data = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        availabilityMode: mode,
        availabilityDurationMinutes: mode === "PUBLISH_TIMER" || mode === "MANUAL_TIMER" ? duration : null,
        availabilityStartedAt,
        availabilityStartsAt: mode === "FIXED_WINDOW" ? scheduledStart : null,
        availabilityEndsAt: mode === "FIXED_WINDOW" ? scheduledEnd : null,
      },
    });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const startQuizAvailabilityDB = async ({ quizId }: { quizId: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, slug: true, published: true, availabilityMode: true, availabilityStartedAt: true },
    });
    if (!quiz) return { ok: false, error: "Quiz not found." };
    if (!quiz.published) return { ok: false, error: "Publish the quiz before starting its shared timer." };
    if (quiz.availabilityMode !== "MANUAL_TIMER") return { ok: false, error: "Switch availability to manual start first." };
    if (quiz.availabilityStartedAt) return { ok: true, data: quiz, alreadyStarted: true };

    const data = await prisma.quiz.update({ where: { id: quizId }, data: { availabilityStartedAt: new Date() } });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const publishQuizDB = async ({ quizId }: { quizId: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const current = await prisma.quiz.findUnique({ where: { id: quizId }, select: { availabilityMode: true } });
    if (!current) return { ok: false, error: "Quiz not found." };
    const now = new Date();
    const data = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        published: true,
        publishedAt: now,
        availabilityStartedAt: current.availabilityMode === "PUBLISH_TIMER" ? now : null,
      },
    });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const unPublishQuizDB = async ({ quizId }: { quizId: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

    const data = await prisma.quiz.update({ where: { id: quizId }, data: { published: false, publishedAt: null, availabilityStartedAt: null } });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
};

export const getQuizDB = async ({ id }: { id: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    if (!(await getAccessibleQuiz(id, userId))) return { ok: false, error: "Quiz not found or access denied." };

    // Do not load all participants just to render the quiz editor. Their results
    // are fetched separately when the Participants tab is opened.
    const data = await prisma.quiz.findUnique({
      where: { id },
      include: {
        images: true,
        questions: { include: { options: true } },
        group: { select: { name: true, adminId: true, admin: { select: { id: true, name: true, email: true } } } },
        collaborators: { select: { userId: true } },
      },
    });
    if (!data) return { ok: false, error: "Quiz not found." };
    return {
      ok: true,
      data: {
        ...data,
        mainAdminId: data.group.adminId,
        groupName: data.group.name,
        isMainAdmin: data.group.adminId === userId,
        isCollaborator: data.collaborators.some((collaborator) => collaborator.userId === userId),
      },
    };
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
    const selectedPublicIds = images.map((image) => image.publicId).filter((value): value is string => Boolean(value));
    if (selectedPublicIds.length) {
      const libraryImages = await prisma.userImage.findMany({ where: { userId, publicId: { in: selectedPublicIds } }, select: { publicId: true, url: true } });
      const allowed = new Map(libraryImages.map((image) => [image.publicId, image.url]));
      if (images.some((image) => image.publicId && allowed.get(image.publicId) !== image.url)) {
        return { ok: false, error: "Choose images from your personal image library or upload them first." };
      }
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const slug = await createUniqueQuizSlug(title);
    const data = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          slug,
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
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

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

    const existingQuiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { title: true, slug: true, previousSlugs: true } });
    if (!existingQuiz) return { ok: false, error: "Quiz not found." };
    const titleChanged = existingQuiz.title.trim() !== title;
    const nextSlug = titleChanged ? await createUniqueQuizSlug(title, quizId) : existingQuiz.slug;
    const previousSlugs = [...new Set([...(existingQuiz.previousSlugs ?? []), ...(titleChanged && existingQuiz.slug ? [existingQuiz.slug] : [])])].filter((value) => value !== nextSlug).slice(-20);

    const previousImages = await prisma.image.findMany({ where: { quizId }, select: { publicId: true, url: true } });
    // Preserve legacy cover images in this user's library before detaching them.
    // Deleting a quiz slot must not unexpectedly delete a reusable source asset.
    for (const image of previousImages) {
      await prisma.userImage.upsert({
        where: { userId_publicId: { userId, publicId: image.publicId } },
        update: { url: image.url },
        create: { userId, publicId: image.publicId, url: image.url },
      });
    }
    const selectedPublicIds = images.map((image) => image.publicId).filter((value): value is string => Boolean(value));
    const libraryImages = selectedPublicIds.length
      ? await prisma.userImage.findMany({ where: { userId, publicId: { in: selectedPublicIds } }, select: { publicId: true, url: true } })
      : [];
    const allowedImages = new Map<string, string>();
    for (const image of previousImages) allowedImages.set(image.publicId, image.url);
    for (const image of libraryImages) allowedImages.set(image.publicId, image.url);
    if (images.some((image) => image.publicId && allowedImages.get(image.publicId) !== image.url)) {
      return { ok: false, error: "Choose images from your personal image library or keep images already attached to this quiz." };
    }

    const data = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.update({
        where: { id: quizId },
        data: {
          title,
          ...(nextSlug ? { slug: nextSlug } : {}),
          previousSlugs,
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

    // Detaching an image from a quiz is not the same as deleting it from the
    // library. The library owns asset lifecycle, so keep unselected files there.
    return { ok: true, data, warning: undefined };
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

    const images = await prisma.image.findMany({ where: { quizId }, select: { publicId: true, url: true } });
    for (const image of images) {
      await prisma.userImage.upsert({
        where: { userId_publicId: { userId, publicId: image.publicId } },
        update: { url: image.url },
        create: { userId, publicId: image.publicId, url: image.url },
      });
    }
    const data = await prisma.quiz.delete({ where: { id: quizId } });
    // Quiz deletion must never delete reused images from Cloudinary. We already
    // ensured every attached image is retained in the owner's library above.
    return { ok: true, data };
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
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };
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
    const ownedQuestion = await getAccessibleQuestion(questionId, userId);
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
    if (!(await getAccessibleQuestion(questionId, userId))) return { ok: false, error: "Question not found or access denied." };

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
    if (!(await getAccessibleQuiz(quizId, userId))) return { ok: false, error: "Quiz not found or access denied." };

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
