import { auth } from "@/auth";
import { getAccessibleQuiz } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_CHARS = 600_000;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 8 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Email payload is too large." }, { status: 413 });
    }

    const payload = await request.json().catch(() => null);
    const participantId = typeof payload?.participantId === "string" ? payload.participantId : "";
    const subject = typeof payload?.subject === "string" ? payload.subject.trim() : "";
    const body = payload?.body;
    const attachment = payload?.attachment as { filename?: string; content?: string; mimeType?: string } | undefined;

    if (!participantId || !subject || subject.length > 180 || !body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Missing or invalid email fields." }, { status: 400 });
    }
    const html = typeof body.html === "string" ? body.html : "";
    const text = typeof body.text === "string" ? body.text : "";
    if ((!html && !text) || html.length > MAX_BODY_CHARS || text.length > MAX_BODY_CHARS) {
      return NextResponse.json({ ok: false, error: "Email body is missing or too large." }, { status: 400 });
    }

    const participant = await prisma.quizParticipant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        quizId: true,
        sentEmailId: true,
        participantName: true,
        participantEmail: true,
        User: { select: { name: true, email: true } },
      },
    });
    if (!participant) return NextResponse.json({ ok: false, error: "Participant not found." }, { status: 404 });
    if (!(await getAccessibleQuiz(participant.quizId, adminId))) {
      return NextResponse.json({ ok: false, error: "You cannot email participants for this quiz." }, { status: 403 });
    }

    // Do not accept recipients from the browser. The destination is derived
    // from the participant record owned by this admin.
    const recipientEmail = participant.participantEmail ?? participant.User.email;
    const recipientName = participant.participantName ?? participant.User.name ?? "Quiz participant";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return NextResponse.json({ ok: false, error: "Participant has no valid email address." }, { status: 400 });
    }

    let attachments: { filename: string; content: Buffer; contentType: string }[] | undefined;
    if (attachment) {
      if (
        typeof attachment.filename !== "string" ||
        attachment.filename.length > 120 ||
        typeof attachment.content !== "string" ||
        attachment.content.length > Math.ceil(MAX_ATTACHMENT_BYTES * 4 / 3) + 16 ||
        attachment.mimeType !== "application/pdf"
      ) {
        return NextResponse.json({ ok: false, error: "Only PDF attachments up to 5 MB are supported." }, { status: 400 });
      }
      const content = Buffer.from(attachment.content, "base64");
      if (!content.length || content.length > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json({ ok: false, error: "PDF attachment is too large." }, { status: 413 });
      }
      attachments = [{ filename: attachment.filename.replace(/[\r\n\/\\]/g, "_") || "result.pdf", content, contentType: "application/pdf" }];
    }

    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const senderAddress = process.env.SENDER_ADDRESS;
    if (!host || !emailUser || !emailPass || !senderAddress || !Number.isFinite(port)) {
      return NextResponse.json({ ok: false, error: "Email delivery is not configured." }, { status: 503 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: emailUser, pass: emailPass },
    });

    const info = await transporter.sendMail({
      from: `"${(process.env.SENDER_NAME || "Quizvera").replace(/[\r\n\"]/g, "")}" <${senderAddress}>`,
      to: [{ name: recipientName, address: recipientEmail }],
      subject,
      text: text || "Your quiz result is available in the attached report.",
      html: html || undefined,
      attachments,
    });

    if (info.messageId) {
      await prisma.quizParticipant.update({
        where: { id: participant.id },
        data: { sentEmailId: info.messageId },
      });
    }

    return NextResponse.json({ ok: true, message: "Email sent successfully", data: { messageId: info.messageId } });
  } catch (cause) {
    console.error("POST /api/email failed:", cause);
    return NextResponse.json({ ok: false, error: "Could not send the email. Please try again." }, { status: 500 });
  }
}
