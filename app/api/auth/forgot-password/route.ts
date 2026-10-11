import { randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { forgotPasswordTemplate } from "@/email_templates/forgot_password";

export const runtime = "nodejs";

const genericMessage = "If an account exists for that email, password-reset instructions will be sent shortly.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    }

    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const senderAddress = process.env.SENDER_ADDRESS;
    const senderName = process.env.SENDER_NAME || "Quizvera";

    // Check infrastructure before looking up the address so configuration
    // failures do not reveal whether a particular account exists.
    if (!host || !emailUser || !emailPass || !senderAddress) {
      console.error("Password reset email is not configured.");
      return NextResponse.json({ ok: false, error: "Password reset email is currently unavailable." }, { status: 503 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
    // Keep response body identical for unknown emails to avoid account enumeration.
    if (!user) return NextResponse.json({ ok: true, message: genericMessage });

    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashPassword(token), resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const resetUrl = `${publicBaseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: emailUser, pass: emailPass },
    });

    try {
      await transporter.sendMail({
        from: `"${senderName}" <${senderAddress}>`,
        to: `${user.name || "Quizvera user"} <${user.email}>`,
        subject: "Reset your Quizvera password",
        html: forgotPasswordTemplate(resetUrl, senderName),
        text: `Use this link to reset your Quizvera password: ${resetUrl}. This link expires in one hour.`,
      });
    } catch (mailError) {
      await prisma.user.update({ where: { id: user.id }, data: { resetToken: null, resetTokenExpiry: null } });
      throw mailError;
    }

    return NextResponse.json({ ok: true, message: genericMessage });
  } catch (error) {
    console.error("POST /api/auth/forgot-password failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not process the reset request. Please try again later." },
      { status: 500 },
    );
  }
}
