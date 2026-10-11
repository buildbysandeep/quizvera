import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type QuizAttemptClaims = {
  userId: string;
  quizId: string;
  groupId: string;
  name: string;
  email: string;
  phone: string;
  iat: number;
  exp: number;
  nonce: string;
};

const ATTEMPT_TTL_MS = 4 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters to issue quiz attempts.");
  }
  return value;
}

function signature(encodedPayload: string): Buffer {
  return createHmac("sha256", secret()).update(encodedPayload).digest();
}

/** Stable guest identity per quiz+email avoids binding public attempts to a real account. */
export function createGuestIdentity(quizId: string, normalizedEmail: string) {
  const digest = createHmac("sha256", secret()).update(`${quizId}:${normalizedEmail}`).digest("hex");
  return {
    id: digest.slice(0, 24), // MongoDB ObjectId-shaped deterministic key.
    email: `guest-${digest.slice(0, 32)}@participants.quizvera.invalid`,
  };
}

export function createQuizAttemptToken(input: Omit<QuizAttemptClaims, "iat" | "exp" | "nonce">): string {
  const issuedAt = Date.now();
  const payload: QuizAttemptClaims = {
    ...input,
    iat: issuedAt,
    exp: issuedAt + ATTEMPT_TTL_MS,
    nonce: randomBytes(18).toString("base64url"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const encodedSignature = signature(encodedPayload).toString("base64url");
  return `${encodedPayload}.${encodedSignature}`;
}

export function verifyQuizAttemptToken(token: unknown): QuizAttemptClaims | null {
  if (typeof token !== "string" || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  try {
    const expected = signature(parts[0]);
    const supplied = Buffer.from(parts[1], "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

    const value = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as Partial<QuizAttemptClaims>;
    if (
      typeof value.userId !== "string" ||
      typeof value.quizId !== "string" ||
      typeof value.groupId !== "string" ||
      typeof value.name !== "string" ||
      typeof value.email !== "string" ||
      typeof value.phone !== "string" ||
      typeof value.iat !== "number" ||
      typeof value.exp !== "number" ||
      typeof value.nonce !== "string" ||
      value.iat > Date.now() + 30_000 ||
      value.exp <= Date.now() ||
      value.exp <= value.iat
    ) {
      return null;
    }
    return value as QuizAttemptClaims;
  } catch {
    return null;
  }
}
