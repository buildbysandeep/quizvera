import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";

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

    // Launch Puppeteer
    // const isVercel = process.env.VERCEL === "1";

    // console.log(isVercel ? "on vercel" : "no vercel");

    // if (isVercel) {
    const executablePath = await chromium.executablePath();

    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
    // } else {
    //   browser = await puppeteer.launch({
    //     headless: true,
    //   });
    // }

    const page = await browser.newPage();

    // Set the content for Puppeteer
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "10px",
        right: "10px",
      },
    });

    // Create a custom response with the PDF
    const pdfBody = new Uint8Array(pdfBuffer.byteLength);
    pdfBody.set(pdfBuffer);

    return new Response(pdfBody.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=generated.pdf",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Return an error response
    return new Response(JSON.stringify({ error: "Failed to generate PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
