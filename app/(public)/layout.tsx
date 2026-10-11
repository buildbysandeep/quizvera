import type { Metadata } from "next";
import Fonts from "../fonts/outfit";
// @ts-ignore
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Quizvera | Assessment",
  description: "Read your assessment instructions, complete the quiz, and submit your responses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${Fonts.Light} ${Fonts.ExtraLight} ${Fonts.Thin} ${Fonts.Medium} ${Fonts.Regular} ${Fonts.SemiBold} ${Fonts.Bold} ${Fonts.ExtraBold} antialiased`}
      >
        <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
