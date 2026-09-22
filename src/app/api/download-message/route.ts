import { NextRequest, NextResponse } from "next/server";
import {
  getBrowserLaunchOptions,
  PUPPETEER_TIMEOUTS,
} from "@/lib/puppeteer-utils";
import {
  fetchWithRefresh,
  mergeSetCookieHeaders,
} from "@/lib/auth/server-refresh";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid request body: expected valid JSON.", {
      status: 400,
    });
  }

  const {
    threadId,
    analysisId,
    analysisType = "stock_analysis",
    selectedSections,
    personalComment,
  } = body;
  if (!threadId || !analysisId) {
    return new NextResponse("Please provide a threadId and analysisId.", {
      status: 400,
    });
  }

  const origin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // Determine report route based on analysis type
  let reportPath: string;
  if (analysisType === "mf_analysis") {
    reportPath = "mf-analysis-report";
  } else if (analysisType === "pf_analysis") {
    reportPath = "pf-analysis-report";
  } else {
    reportPath = "stock-analysis-report";
  }

  const gotoRoute = new URL(`${origin}/api/download-message/${reportPath}`);
  gotoRoute.searchParams.set("threadId", threadId);
  gotoRoute.searchParams.set("analysisId", analysisId);

  // Pass selected sections and personal comment to the report page
  if (selectedSections && Array.isArray(selectedSections)) {
    gotoRoute.searchParams.set(
      "selectedSections",
      JSON.stringify(selectedSections),
    );
  }
  if (personalComment) {
    const sanitizedComment = String(personalComment).slice(0, 2000);
    gotoRoute.searchParams.set("personalComment", sanitizedComment);
  }

  // The report page reads the access token as-is, and the browser drops that
  // cookie after 15 minutes. Refresh here first so an idle tab still exports,
  // and hand any rotated pair back to the browser on the PDF response.
  const session: { accessToken?: string; fingerprint?: string } = {};
  const { response: authResponse, refreshSetCookieHeaders } =
    await fetchWithRefresh(request, async (accessToken, fingerprint) => {
      session.accessToken = accessToken;
      session.fingerprint = fingerprint;
      return new Response(null, { status: 204 });
    });
  const { accessToken, fingerprint } = session;
  if (!accessToken) return authResponse;

  let browser;
  try {
    // Get browser configuration based on environment
    const { puppeteer, launchOptions } = await getBrowserLaunchOptions();

    // Launch browser
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // Forward auth cookies to Puppeteer so the report page can
    // authenticate with the backend via the API proxy.
    const targetUrl = new URL(gotoRoute.toString());
    const domain = targetUrl.hostname;
    const isHttps = targetUrl.protocol === "https:";
    const fgpName = isHttps ? "__Secure-Fgp" : "fgp";
    // The refresh token stays out: the page never refreshes, and a rotated
    // one would already be spent.
    const authCookies: [string, string | undefined][] = [
      ["access_token", accessToken],
      [fgpName, fingerprint],
    ];
    const puppeteerCookies = authCookies
      .filter((c): c is [string, string] => !!c[1])
      .map(([name, value]) => ({
        name,
        value,
        domain,
        path: "/",
        secure: isHttps,
      }));
    if (puppeteerCookies.length > 0) {
      await page.setCookie(...puppeteerCookies);
    }

    // Use a consistent viewport to avoid reflow when printing to PDF
    await page.setViewport({ width: 864, height: 800, deviceScaleFactor: 1 });

    // Ensure screen CSS (not print CSS) is applied and wait for network + fonts
    await page.emulateMediaType("screen");
    await page.goto(gotoRoute.toString(), {
      waitUntil: "networkidle0",
      timeout: PUPPETEER_TIMEOUTS.PAGE_LOAD,
    });
    try {
      await Promise.race([
        page.evaluate(() => (window as any).document.fonts?.ready),
        new Promise((resolve) =>
          setTimeout(resolve, PUPPETEER_TIMEOUTS.FONT_READY),
        ),
      ]);
    } catch (err) {
      console.warn("Font readiness check failed:", err);
    }

    const pdfOptions = {
      printBackground: true,
      format: "A4" as const,
      scale: 1,
    };
    const pdfBuffer = await page.pdf(pdfOptions);
    return mergeSetCookieHeaders(
      new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="report.pdf"',
        },
      }),
      refreshSetCookieHeaders,
    );
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(
      `An error occurred while generating the PDF report: ${message}`,
      { status: 500 },
    );
  } finally {
    // Always clean up browser resources
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.warn("Failed to close browser:", closeError);
      }
    }
  }
}
