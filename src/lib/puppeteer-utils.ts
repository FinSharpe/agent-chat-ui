/**
 * Puppeteer utilities for PDF generation and browser automation
 */

// Timeout constants
export const PUPPETEER_TIMEOUTS = {
  PAGE_LOAD: 30000, // 30 seconds
  FONT_READY: 5000, // 5 seconds
} as const;

// Cache the Chromium executable path to avoid re-decompressing on subsequent requests
let cachedExecutablePath: string | null = null;
let executablePromise: Promise<string> | null = null;

/**
 * Resolves and caches the Chromium executable path.
 * Uses @sparticuz/chromium which decompresses from its own node_modules
 * (no HTTP download needed).
 */
export async function getChromiumPath(): Promise<string> {
  if (cachedExecutablePath) return cachedExecutablePath;

  if (!executablePromise) {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePromise = chromium
      .executablePath()
      .then((path: string) => {
        cachedExecutablePath = path;
        console.log("Chromium path resolved:", path);
        return path;
      })
      .catch((error: unknown) => {
        console.error("Failed to get Chromium path:", error);
        executablePromise = null;
        throw error;
      });
  }

  return executablePromise;
}

/**
 * Creates browser launch options based on environment
 */
export async function getBrowserLaunchOptions() {
  const isVercel = !!process.env.VERCEL_ENV;
  let puppeteer: any;
  let launchOptions: any = {
    headless: true,
  };

  if (isVercel) {
    // Vercel: Use puppeteer-core with @sparticuz/chromium (decompresses locally)
    const chromium = (await import("@sparticuz/chromium")).default;
    puppeteer = await import("puppeteer-core");
    const executablePath = await getChromiumPath();
    launchOptions = {
      ...launchOptions,
      args: chromium.args,
      executablePath,
    };
    console.log("Launching browser with executable path:", executablePath);
  } else {
    // Local: Use regular puppeteer with bundled Chromium
    puppeteer = await import("puppeteer");
  }

  return { puppeteer, launchOptions };
}
