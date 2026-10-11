import { prisma } from "./prisma";
import { comparePassword } from "./utils";

export async function handleGoogleSignIn({ profile }: { profile?: Record<string, unknown> | null }) {
  const email = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
  const name = typeof profile?.name === "string" ? profile.name.trim() : "";
  const googleId = typeof profile?.sub === "string" ? profile.sub : "";

  // Only accept verified Google email addresses. Never auto-link a Google
  // account to an existing credentials account based on email alone.
  if (!email || profile?.email_verified !== true || !googleId) return false;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, googleId: true },
  });

  if (user && user.googleId !== googleId) {
    return "/sign-in?error=not-registered-with-google";
  }

  if (!user) {
    await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        googleId,
        isOnBoarded: true,
      },
      select: { id: true },
    });
  }

  return true;
}

export async function handleCredentialsSignIn({ email, password }: { email: string; password: string }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isOnBoarded: true,
      googleId: true,
      passwordHash: true,
    },
  });

  if (!user || user.googleId || !user.passwordHash) return null;
  if (!comparePassword(password, user.passwordHash)) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isOnBoarded: user.isOnBoarded,
  };
}

export async function handleFindUser({ email }: { email: string }) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, role: true, isOnBoarded: true, googleId: true },
  });
}
