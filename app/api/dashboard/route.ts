import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

type DateRange = { from: Date; to: Date };
type CivilDateParts = { year: number; month: number; day: number };

function parseDate(value: string | null, isEndDate = false): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  // Keep compatibility with callers sending YYYY-MM-DD. Date-picker callers
  // send local start/end-of-day ISO timestamps, which are parsed unchanged.
  if (isEndDate && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function getDateRange(searchParams: URLSearchParams, now: Date): DateRange | null {
  const fromValue = searchParams.get("from");
  const toValue = searchParams.get("to");
  const suppliedFrom = parseDate(fromValue);
  const suppliedTo = parseDate(toValue, true);

  if ((fromValue && !suppliedFrom) || (toValue && !suppliedTo)) return null;

  const from =
    suppliedFrom ??
    (suppliedTo
      ? new Date(Date.UTC(suppliedTo.getUTCFullYear(), suppliedTo.getUTCMonth() - 11, 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)));
  const to = suppliedTo ?? now;
  if (from.getTime() > to.getTime()) return null;
  return { from, to };
}

function datePartsInTimeZone(date: Date, timeZone: string): CivilDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function dayKeyFromParts(parts: CivilDateParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function dayKey(date: Date, timeZone: string): string {
  return dayKeyFromParts(datePartsInTimeZone(date, timeZone));
}

function monthKey(date: Date, timeZone: string): string {
  const parts = datePartsInTimeZone(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

// The Date instances in the overview map are synthetic UTC dates representing
// calendar labels. Format them in UTC so the labels do not shift by timezone.
function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildOverview(dates: Date[], range: DateRange, timeZone: string) {
  const fromParts = datePartsInTimeZone(range.from, timeZone);
  const toParts = datePartsInTimeZone(range.to, timeZone);
  const firstDay = new Date(Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day));
  const lastDay = new Date(Date.UTC(toParts.year, toParts.month - 1, toParts.day));
  const daySpan = Math.floor((lastDay.getTime() - firstDay.getTime()) / DAY_MS) + 1;
  const granularity: "day" | "month" = daySpan <= 62 ? "day" : "month";
  const buckets = new Map<string, { key: string; name: string; total: number }>();

  let cursor = granularity === "day" ? firstDay : new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth(), 1));
  const end = granularity === "day" ? lastDay : new Date(Date.UTC(lastDay.getUTCFullYear(), lastDay.getUTCMonth(), 1));

  while (cursor.getTime() <= end.getTime()) {
    const key =
      granularity === "day"
        ? dayKeyFromParts({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1, day: cursor.getUTCDate() })
        : `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;

    buckets.set(key, {
      key,
      name: granularity === "day" ? formatDay(cursor) : formatMonth(cursor),
      total: 0,
    });

    cursor =
      granularity === "day"
        ? new Date(cursor.getTime() + DAY_MS)
        : new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  for (const date of dates) {
    const key = granularity === "day" ? dayKey(date, timeZone) : monthKey(date, timeZone);
    const bucket = buckets.get(key);
    if (bucket) bucket.total += 1;
  }

  return { granularity, data: Array.from(buckets.values()) };
}

type ParticipantScoreSource = {
  id: string;
  userId: string;
  createdAt: Date;
  isQualified: boolean;
  participantName: string | null;
  participantEmail: string | null;
  User: { name: string | null; email: string };
  Quiz: { id: string; slug: string | null; title: string; _count: { questions: number } };
  Answers: { answer: string; questionId: string }[];
};

type QuestionAnswerKey = { answer: string; quizId: string };

function scoreParticipant(participant: ParticipantScoreSource, answerKeyByQuestion: Map<string, QuestionAnswerKey>) {
  // MongoDB can contain stale ParticipantQuizAnswer documents after a question
  // has been deleted outside Prisma. Ignore missing questions and answers that
  // accidentally point to a question belonging to another quiz.
  const validAnswers = participant.Answers.filter((item) => {
    const question = answerKeyByQuestion.get(item.questionId);
    return question?.quizId === participant.Quiz.id;
  });

  const correctAnswers = validAnswers.filter((item) => {
    return item.answer === answerKeyByQuestion.get(item.questionId)?.answer;
  }).length;
  const totalQuestions = participant.Quiz._count.questions;
  const answeredQuestions = validAnswers.length;

  return {
    id: participant.id,
    name: participant.participantName ?? participant.User.name ?? "Unknown participant",
    email: participant.participantEmail ?? participant.User.email,
    quizId: participant.Quiz.id,
    quizSlug: participant.Quiz.slug,
    quizTitle: participant.Quiz.title,
    correctAnswers,
    answeredQuestions,
    unansweredQuestions: Math.max(0, totalQuestions - answeredQuestions),
    totalQuestions,
    percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
    isQualified: participant.isQualified,
    createdAt: participant.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;

    if (!adminId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const searchParams = request.nextUrl.searchParams;
    const range = getDateRange(searchParams, now);
    if (!range) {
      return NextResponse.json(
        { ok: false, error: "Invalid date range. Use valid from/to dates, with from <= to." },
        { status: 400 },
      );
    }

    const timeZone = searchParams.get("timeZone") || "UTC";
    try {
      new Intl.DateTimeFormat("en-US", { timeZone }).format(now);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid timezone." }, { status: 400 });
    }

    // Only groups owned by the authenticated admin can contribute to this dashboard.
    const requestedGroupId = searchParams.get("groupId");
    const ownedGroups = await prisma.group.findMany({
      where: { adminId },
      select: {
        id: true,
        name: true,
        quizzes: {
          select: {
            id: true,
            title: true,
            published: true,
            createdAt: true,
            _count: { select: { questions: true, participants: true } },
          },
        },
      },
    });

    const groups = requestedGroupId ? ownedGroups.filter((group) => group.id === requestedGroupId) : ownedGroups;

    if (requestedGroupId && groups.length === 0) {
      return NextResponse.json({ ok: false, error: "Group not found" }, { status: 404 });
    }

    const groupIds = groups.map((group) => group.id);
    const quizzes = groups.flatMap((group) => group.quizzes);
    const totalGroups = groups.length;
    const totalQuizzes = quizzes.length;
    const publishedQuizzes = quizzes.filter((quiz) => quiz.published).length;
    const draftQuizzes = totalQuizzes - publishedQuizzes;
    const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz._count.questions, 0);
    const totalSubmissions = quizzes.reduce((sum, quiz) => sum + quiz._count.participants, 0);

    const [qualifiedSubmissions, participantsInRange] = groupIds.length
      ? await Promise.all([
          prisma.quizParticipant.count({
            where: { groupId: { in: groupIds }, isQualified: true },
          }),
          prisma.quizParticipant.findMany({
            where: {
              groupId: { in: groupIds },
              createdAt: { gte: range.from, lte: range.to },
            },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              userId: true,
              createdAt: true,
              isQualified: true,
              participantName: true,
              participantEmail: true,
              User: { select: { name: true, email: true } },
              Quiz: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  _count: { select: { questions: true } },
                },
              },
              Answers: {
                // Do not join the required Question relation here. Legacy
                // orphaned answer records can make Prisma throw an
                // Inconsistent query result before application code can filter.
                select: {
                  answer: true,
                  questionId: true,
                },
              },
            },
          }),
        ])
      : ([0, []] as const);

    // Resolve question answer keys in a separate query. This safely handles
    // stale answer documents whose referenced Question no longer exists.
    const questionIds = Array.from(
      new Set(participantsInRange.flatMap((participant) => participant.Answers.map((answer) => answer.questionId))),
    );
    const questionRecords = questionIds.length
      ? await prisma.question.findMany({
          where: { id: { in: questionIds } },
          select: { id: true, quizId: true, answer: true },
        })
      : [];

    const answerKeyByQuestion = new Map<string, QuestionAnswerKey>(
      questionRecords.map((question) => [question.id, { quizId: question.quizId, answer: question.answer }]),
    );

    const recentScores = participantsInRange
      .slice(0, 5)
      .map((participant) => scoreParticipant(participant, answerKeyByQuestion));

    // Keep each student once, using their best quiz result in the current date/folder scope.
    // Percentages are comparable accuracy scores because the schema does not store score marks.
    const bestScoreByUser = new Map<string, { userId: string; score: ReturnType<typeof scoreParticipant> }>();
    for (const participant of participantsInRange) {
      const score = scoreParticipant(participant, answerKeyByQuestion);
      // Guest user IDs are intentionally scoped per quiz; email identity is the
      // cross-quiz key so the same student isn't listed multiple times.
      const studentKey = (participant.participantEmail ?? participant.User.email).trim().toLowerCase();
      const previous = bestScoreByUser.get(studentKey);
      const newer = previous && new Date(score.createdAt).getTime() > new Date(previous.score.createdAt).getTime();
      const isBetter =
        !previous ||
        score.percentage > previous.score.percentage ||
        (score.percentage === previous.score.percentage && score.correctAnswers > previous.score.correctAnswers) ||
        (score.percentage === previous.score.percentage &&
          score.correctAnswers === previous.score.correctAnswers &&
          Boolean(newer));

      if (isBetter) bestScoreByUser.set(studentKey, { userId: participant.userId, score });
    }

    const topScores = Array.from(bestScoreByUser.values())
      .sort(
        (a, b) =>
          b.score.percentage - a.score.percentage ||
          b.score.correctAnswers - a.score.correctAnswers ||
          new Date(b.score.createdAt).getTime() - new Date(a.score.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((entry) => entry.score);

    const overview = buildOverview(
      participantsInRange.map((participant) => participant.createdAt),
      range,
      timeZone,
    );

    return NextResponse.json({
      ok: true,
      data: {
        stats: {
          totalGroups,
          totalQuizzes,
          publishedQuizzes,
          draftQuizzes,
          totalQuestions,
          totalSubmissions,
          qualifiedSubmissions,
          submissionsInRange: participantsInRange.length,
        },
        overview,
        recentScores,
        topScores,
        dateRange: { from: range.from.toISOString(), to: range.to.toISOString(), timeZone },
      },
    });
  } catch (err) {
    console.error("GET /api/dashboard failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to load dashboard data" }, { status: 500 });
  }
}
