import { prisma } from "./prisma";
import { comparePassword } from "./utils";

export const handleGoogleSignIn = async ({ profile }: any) => {
  const user = await prisma.user.findUnique({
    where: { email: profile?.email! },
  });

  if (user && !user?.googleId) {
    return "/sign-in?error=not-registered-with-google&email=" + profile?.email!;
  }

  if (!user) {
    await prisma.user.create({
      data: {
        name: profile?.name!,
        email: profile?.email!,
        googleId: profile?.sub!,
        isOnBoarded: true,
      },
    });
  }

  return true;
};

export const handleCredentialsSignIn = async ({ email, password }: { email: string; password: string }) => {
  if (!email || !password) {
    console.log("invalid credentials");
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("user not found");
    return null;
  }

  if (user.googleId) {
    console.log("user registered with google");
    return null;
  }

  if (!user.passwordHash) {
    console.log("user not registered with password");
    return null;
  }

  if (!comparePassword(password, user.passwordHash)) {
    console.log("password mismatch");
    return null;
  }

  return { id: user.id, email: user.email, name: user.name, role: user.role, isOnBoarded: user.isOnBoarded };
};

export const handleFindUser = async ({ email }: { email: string }) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};
