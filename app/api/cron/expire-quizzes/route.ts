import { prisma } from "@/lib/prisma";
import { evaluateQuizAvailability } from "@/lib/quiz-availability";
import { NextRequest, NextResponse } from "next/server";

/**
 * Scheduler endpoint: call once per minute with `Authorization: Bearer <CRON_SECRET>`.
 * Public access is still blocked at the exact deadline even if this scheduler is
 * delayed; this job persists the expired state for the dashboard and sidebar.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();
    const publishedQuizzes = await prisma.quiz.findMany({
      where: { published: true, availabilityMode: { in: ["PUBLISH_TIMER", "MANUAL_TIMER", "FIXED_WINDOW"] } },
      select: {
        id: true,
        published: true,
        createdAt: true,
        publishedAt: true,
        availabilityMode: true,
        availabilityDurationMinutes: true,
        availabilityStartedAt: true,
        availabilityStartsAt: true,
        availabilityEndsAt: true,
      },
    });
    const expiredIds = publishedQuizzes
      .filter((quiz) => {
        const state = evaluateQuizAvailability(quiz, now);
        return state.status === "expired" && (state.expiredReason === "timer" || state.expiredReason === "schedule");
      })
      .map((quiz) => quiz.id);

    if (expiredIds.length) {
      await prisma.quiz.updateMany({ where: { id: { in: expiredIds }, published: true }, data: { published: false } });
    }

    return NextResponse.json(
      { ok: true, checked: publishedQuizzes.length, expired: expiredIds.length, checkedAt: new Date(now).toISOString() },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  } catch (cause) {
    console.error("Quiz expiry scheduler failed:", cause);
    return NextResponse.json({ ok: false, error: "Could not check scheduled quiz expiry." }, { status: 500 });
  }
}
