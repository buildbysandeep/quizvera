import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const runtime = "nodejs";
export const maxDuration = 60;

const CHROMIUM_PACK_URL = "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

export async function POST(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | Awaited<ReturnType<typeof puppeteerCore.launch>> | undefined;

  try {
    const { html } = await req.json();
    if (!html) {
      return new Response(JSON.stringify({ error: "HTML content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);

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
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "10px", right: "10px" },
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=generated.pdf",
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
