import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "My quizzes | Quizvera",
  description: "Browse and manage your quizzes.",
};

export default function MyQuizzesLayout({ children }: { children: React.ReactNode }) {
  // The protected route folder already owns the root <html> and <body>.
  return <>{children}</>;
}
