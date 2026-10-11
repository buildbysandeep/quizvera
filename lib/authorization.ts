import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Returns the authenticated application user ID, or null for anonymous requests. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

export async function userOwnsGroup(groupId: string, userId: string): Promise<boolean> {
  const group = await prisma.group.findFirst({
    where: { id: groupId, adminId: userId },
    select: { id: true },
  });
  return Boolean(group);
}

/** Strict owner check. Keep for destructive actions reserved for the primary admin. */
export async function getOwnedQuiz(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, groupId: true, group: { select: { adminId: true } } },
  });
  if (!quiz || quiz.group.adminId !== userId) return null;
  return { id: quiz.id, groupId: quiz.groupId, mainAdminId: quiz.group.adminId };
}

/** Returns quiz access for either the primary admin or an explicitly added collaborator. */
export async function getAccessibleQuiz(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      groupId: true,
      group: { select: { adminId: true } },
      collaborators: { where: { userId }, select: { id: true } },
    },
  });
  if (!quiz) return null;
  const isMainAdmin = quiz.group.adminId === userId;
  if (!isMainAdmin && quiz.collaborators.length === 0) return null;
  return { id: quiz.id, groupId: quiz.groupId, mainAdminId: quiz.group.adminId, isMainAdmin };
}

/** Returns a question only when its parent quiz is accessible by this user. */
export async function getAccessibleQuestion(questionId: string, userId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, quizId: true },
  });
  if (!question) return null;

  const quiz = await getAccessibleQuiz(question.quizId, userId);
  return quiz ? { ...question, groupId: quiz.groupId, isMainAdmin: quiz.isMainAdmin } : null;
}

/** Owner-only question helper retained for code paths that require primary ownership. */
export async function getOwnedQuestion(questionId: string, userId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, quizId: true },
  });
  if (!question) return null;
  const quiz = await getOwnedQuiz(question.quizId, userId);
  return quiz ? { ...question, groupId: quiz.groupId } : null;
}
