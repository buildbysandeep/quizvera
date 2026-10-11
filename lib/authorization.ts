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

/** Returns a quiz only when it belongs to a group owned by this user. */
export async function getOwnedQuiz(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, groupId: true },
  });
  if (!quiz) return null;

  const ownsGroup = await userOwnsGroup(quiz.groupId, userId);
  return ownsGroup ? quiz : null;
}

/** Returns a question only when its parent quiz belongs to a group owned by this user. */
export async function getOwnedQuestion(questionId: string, userId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, quizId: true },
  });
  if (!question) return null;

  const quiz = await getOwnedQuiz(question.quizId, userId);
  return quiz ? { ...question, groupId: quiz.groupId } : null;
}
