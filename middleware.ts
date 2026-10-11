import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Keep Prisma and bcrypt out of the middleware bundle. The full provider config
// is loaded only by auth.ts on the Node.js runtime.
const { auth: middlewareAuth } = NextAuth(authConfig);

export default middlewareAuth((request) => {
  if (request.auth?.user) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/", "/group/:path*", "/quiz/:path*", "/my-quizes/:path*"],
};
