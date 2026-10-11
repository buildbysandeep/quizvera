import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const runtime = "nodejs";
export const maxDuration = 60;

const CHROMIUM_PACK_URL = "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

export async function POST(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | Awaited<ReturnType<typeof puppeteerCore.launch>> | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 3 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "PDF content is too large." }, { status: 413 });
    }
    const payload = await req.json().catch(() => null);
    const html = typeof payload?.html === "string" ? payload.html : "";
    if (!html.trim()) {
      return NextResponse.json({ ok: false, error: "HTML content is required" }, { status: 400 });
    }
    if (html.length > 2 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "PDF content is too large." }, { status: 413 });
    }

    const isVercel = !!process.env.VERCEL;

    if (isVercel) {
      const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
      });
    }

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(15_000);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      let allowed = false;
      try {
        const url = new URL(request.url());
        allowed =
          url.protocol === "data:" ||
          url.protocol === "blob:" ||
          url.href === "about:blank" ||
          url.origin === "https://cdn.tailwindcss.com";
      } catch {
        allowed = false;
      }
      if (allowed) void request.continue().catch(() => undefined);
      else void request.abort("blockedbyclient").catch(() => undefined);
    });
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15_000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "10px", right: "10px" },
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=quiz-result.pdf",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: "Failed to generate PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    if (browser) await browser.close();
  }
}
