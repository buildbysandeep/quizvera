export type QuizAvailabilityModeValue = "ALWAYS" | "PUBLISH_TIMER" | "MANUAL_TIMER" | "FIXED_WINDOW";
export type QuizAvailabilityStatus = "active" | "waiting" | "expired";

export type QuizAvailabilityInput = {
  published?: boolean | null;
  availabilityMode?: QuizAvailabilityModeValue | null;
  availabilityDurationMinutes?: number | null;
  availabilityStartedAt?: Date | string | null;
  publishedAt?: Date | string | null;
  availabilityStartsAt?: Date | string | null;
  availabilityEndsAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export type QuizAvailabilityResult = {
  mode: QuizAvailabilityModeValue;
  status: QuizAvailabilityStatus;
  startAt: string | null;
  endAt: string | null;
  remainingSeconds: number | null;
  waitingReason: "admin" | "scheduled" | null;
  expiredReason: "unpublished" | "timer" | "schedule" | null;
};

function millis(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function dateString(value: number | null): string | null {
  return value === null ? null : new Date(value).toISOString();
}

/** Evaluate the shared quiz window against an absolute server time. */
export function evaluateQuizAvailability(quiz: QuizAvailabilityInput, now: number = Date.now()): QuizAvailabilityResult {
  const mode: QuizAvailabilityModeValue = ["ALWAYS", "PUBLISH_TIMER", "MANUAL_TIMER", "FIXED_WINDOW"].includes(
    String(quiz.availabilityMode),
  )
    ? (quiz.availabilityMode as QuizAvailabilityModeValue)
    : "ALWAYS";

  if (!quiz.published) {
    // Preserve the actual timer/schedule reason after a request opportunistically
    // persists `published = false`, so in-progress attempts can receive the
    // short delivery grace at the shared deadline.
    const storedStart = millis(quiz.availabilityStartedAt) ?? millis(quiz.publishedAt) ?? millis(quiz.createdAt);
    const duration = Number(quiz.availabilityDurationMinutes ?? 0);
    const timerEnd = storedStart !== null && duration > 0 ? storedStart + duration * 60_000 : null;
    const scheduledEnd = millis(quiz.availabilityEndsAt);
    if ((mode === "PUBLISH_TIMER" || mode === "MANUAL_TIMER") && timerEnd !== null && now >= timerEnd) {
      return {
        mode,
        status: "expired",
        startAt: dateString(storedStart),
        endAt: dateString(timerEnd),
        remainingSeconds: 0,
        waitingReason: null,
        expiredReason: "timer",
      };
    }
    if (mode === "FIXED_WINDOW" && scheduledEnd !== null && now >= scheduledEnd) {
      return {
        mode,
        status: "expired",
        startAt: dateString(millis(quiz.availabilityStartsAt)),
        endAt: dateString(scheduledEnd),
        remainingSeconds: 0,
        waitingReason: null,
        expiredReason: "schedule",
      };
    }
    return {
      mode,
      status: "expired",
      startAt: null,
      endAt: null,
      remainingSeconds: 0,
      waitingReason: null,
      expiredReason: "unpublished",
    };
  }

  if (mode === "ALWAYS") {
    return {
      mode,
      status: "active",
      startAt: null,
      endAt: null,
      remainingSeconds: null,
      waitingReason: null,
      expiredReason: null,
    };
  }

  if (mode === "FIXED_WINDOW") {
    const start = millis(quiz.availabilityStartsAt);
    const end = millis(quiz.availabilityEndsAt);
    if (start === null || end === null || end <= start) {
      return {
        mode,
        status: "waiting",
        startAt: dateString(start),
        endAt: dateString(end),
        remainingSeconds: null,
        waitingReason: "scheduled",
        expiredReason: null,
      };
    }
    if (now < start) {
      return {
        mode,
        status: "waiting",
        startAt: dateString(start),
        endAt: dateString(end),
        remainingSeconds: Math.max(0, Math.ceil((start - now) / 1000)),
        waitingReason: "scheduled",
        expiredReason: null,
      };
    }
    if (now >= end) {
      return {
        mode,
        status: "expired",
        startAt: dateString(start),
        endAt: dateString(end),
        remainingSeconds: 0,
        waitingReason: null,
        expiredReason: "schedule",
      };
    }
    return {
      mode,
      status: "active",
      startAt: dateString(start),
      endAt: dateString(end),
      remainingSeconds: Math.max(0, Math.ceil((end - now) / 1000)),
      waitingReason: null,
      expiredReason: null,
    };
  }

  if (mode === "MANUAL_TIMER") {
    const start = millis(quiz.availabilityStartedAt);
    if (start === null) {
      return {
        mode,
        status: "waiting",
        startAt: null,
        endAt: null,
        remainingSeconds: null,
        waitingReason: "admin",
        expiredReason: null,
      };
    }
    const duration = Number(quiz.availabilityDurationMinutes ?? 0);
    const end = duration > 0 ? start + duration * 60_000 : null;
    if (end !== null && now >= end) {
      return {
        mode,
        status: "expired",
        startAt: dateString(start),
        endAt: dateString(end),
        remainingSeconds: 0,
        waitingReason: null,
        expiredReason: "timer",
      };
    }
    return {
      mode,
      status: "active",
      startAt: dateString(start),
      endAt: dateString(end),
      remainingSeconds: end === null ? null : Math.max(0, Math.ceil((end - now) / 1000)),
      waitingReason: null,
      expiredReason: null,
    };
  }

  const start = millis(quiz.availabilityStartedAt) ?? millis(quiz.publishedAt) ?? millis(quiz.createdAt) ?? now;
  const duration = Number(quiz.availabilityDurationMinutes ?? 0);
  const end = duration > 0 ? start + duration * 60_000 : null;
  if (end !== null && now >= end) {
    return {
      mode,
      status: "expired",
      startAt: dateString(start),
      endAt: dateString(end),
      remainingSeconds: 0,
      waitingReason: null,
      expiredReason: "timer",
    };
  }
  if (now < start) {
    return {
      mode,
      status: "waiting",
      startAt: dateString(start),
      endAt: dateString(end),
      remainingSeconds: Math.max(0, Math.ceil((start - now) / 1000)),
      waitingReason: "scheduled",
      expiredReason: null,
    };
  }
  return {
    mode,
    status: "active",
    startAt: dateString(start),
    endAt: dateString(end),
    remainingSeconds: end === null ? null : Math.max(0, Math.ceil((end - now) / 1000)),
    waitingReason: null,
    expiredReason: null,
  };
}
