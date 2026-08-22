"use server";

import { IImage } from "@/types";
import { prisma } from "../prisma";

export const publishQuizDB = async ({ quizId }: { quizId: string }) => {
  try {
    const res = await prisma.quiz.update({
      where: { id: quizId },
      data: { published: true },
    });
    return { ok: true, data: res };
  } catch (error: any) {
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
  }
};

export const unPublishQuizDB = async ({ quizId }: { quizId: string }) => {
  try {
    const res = await prisma.quiz.update({
      where: { id: quizId },
      data: { published: false },
    });
    return { ok: true, data: res };
  } catch (error: any) {
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
  }
};

export const getQuizDB = async ({ id }: { id: string }) => {
  try {
    const res = await prisma.quiz.findUnique({
      where: { id },
      include: { images: true, questions: { include: { options: true } }, participants: true },
    });

    return { ok: true, data: res };
  } catch (error: any) {
    console.log(error.code);
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
  }
};

export const createQuizDB = async (
  values: { [k: string]: FormDataEntryValue },
  {
    author,
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
    const res = await prisma.$transaction(async (pm) => {
      const quiz = await prisma.quiz.create({
        data: {
          title: values.title as string,
          desc: values.desc as string,
          userInputs: userInputs,
          duration: parseInt(values.duration as string) || 0,
          maxMarks: parseInt(values.maxMarks as string) || 0,
          footerHeading1: values.footerHeading1 as string,
          footerHeading2: values.footerHeading2 as string,
          footerText1: values.footerText1 as string,
          footerText2: values.footerText2 as string,
          footerLink: values.footerLink as string,
          author: author,
          groupId: groupId,
          isStrictMode: isStrictMode,
          translationEnabled: translation.enable,
          sourceLanguage: translation.sourceLanguage,
          targetLanguage: translation.targetLanguage,
        },
        include: { images: true },
      });

      if (images.length > 0) {
        const imagePromises = images.map(async (image) => {
          const res = await pm.image.create({
            data: {
              url: image.url,
              publicId: image.publicId!,
              key: image.key,
              quizId: quiz.id,
            },
          });
          return res;
        });
        const imagesRes = await Promise.all(imagePromises);
        return { ...quiz, images: imagesRes };
      }
      return quiz;
    });
    return { ok: true, data: res };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { ok: false, error: "Group name already exists" };
    }
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
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
    const res = await prisma.$transaction(async (pm) => {
      const quiz = await pm.quiz.update({
        where: { id: quizId as string },
        data: {
          title: values.title as string,
          desc: values.desc as string,
          userInputs: userInputs,
          duration: parseInt(values.duration as string) || 0,
          maxMarks: parseInt(values.maxMarks as string) || 0,
          isStrictMode: isStrictMode,
          translationEnabled: translation.enable,
          sourceLanguage: translation.sourceLanguage,
          targetLanguage: translation.targetLanguage,
          footerHeading1: values.footerHeading1 as string,
          footerHeading2: values.footerHeading2 as string,
          footerText1: values.footerText1 as string,
          footerText2: values.footerText2 as string,
          footerLink: values.footerLink as string,
        },
        include: { images: true },
      });

      if (images.length > 0) {
        await pm.image.deleteMany({
          where: { quizId: quiz.id },
        });

        const imagePromises = images.map(async (image) => {
          return pm.image.create({
            data: {
              key: image.key,
              url: image.url,
              publicId: image.publicId!,
              quizId: quiz.id,
            },
          });
        });
        const imagesRes = await Promise.all(imagePromises);
        return { ...quiz, images: imagesRes };
      }
      return quiz;
    });
    return { ok: true, data: res };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { ok: false, error: "Group name already exists" };
    }
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
  }
};

export const deleteQuizDB = async ({ quizId }: { quizId: string }) => {
  try {
    const res = await prisma.quiz.delete({
      where: { id: quizId },
    });

    return { ok: true, data: res };
  } catch (error: any) {
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
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
  options: {
    key: string;
    value: string;
    translatedValue: string;
  }[];
  quizId: string;
}) => {
  try {
    const res = await prisma.$transaction(async (pm) => {
      const question = await pm.question.create({
        data: {
          title,
          translatedTitle,
          showSnippet,
          snippet,
          snippetLang,
          answer,
          quizId,
        },
      });

      const allOptions = options.map((option) => ({
        key: option.key,
        value: option.value,
        translatedValue: option.translatedValue,
        questionId: question.id,
      }));

      await pm.option.createMany({
        data: allOptions,
      });

      // Query the created options back using findMany
      const createdOptions = await pm.option.findMany({
        where: {
          questionId: question.id,
          key: {
            in: options.map((option) => option.key),
          },
        },
      });

      return { ...question, options: createdOptions };
    });

    return { ok: true, data: res };
  } catch (error: any) {
    if (error.code === "P2002" && error?.message.includes("questions_quizId_title_key")) {
      return { ok: false, error: "Question already exists" };
    }
    if (error.code === "P2002" && error?.message.includes("options_questionId_value_key")) {
      return { ok: false, error: "Duplicate options" };
    }
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
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
  options: {
    id: string;
    key: string;
    value: string;
    translatedValue: string;
  }[];
}) => {
  try {
    const res = await prisma.$transaction(async (pm) => {
      const question = await pm.question.update({
        where: { id: questionId },
        data: {
          title,
          translatedTitle,
          showSnippet,
          snippet,
          snippetLang,
          answer,
        },
      });

      const updatePromises = options.map((option) => {
        return pm.option.update({
          where: { id: option.id },
          data: {
            value: option.value,
            translatedValue: option.translatedValue,
          },
        });
      });

      // Execute all updates in parallel
      const data = await Promise.all(updatePromises);
      return { ...question, options: data };
    });

    return { ok: true, data: res };
  } catch (error: any) {
    if (error.code === "P2002" && error?.message.includes("questions_quizId_title_key")) {
      return { ok: false, error: "Question already exists" };
    }
    if (error.code === "P2002" && error?.message.includes("options_questionId_value_key")) {
      return { ok: false, error: "Duplicate options" };
    }
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
  }
};

export const deleteQuestionDB = async ({ questionId }: { questionId: string }) => {
  try {
    const res = await prisma.question.delete({
      where: { id: questionId },
    });

    return { ok: true, data: res };
  } catch (error: any) {
    console.error(error?.message);
    return { ok: false, error: "Something went wrong" };
  }
};
