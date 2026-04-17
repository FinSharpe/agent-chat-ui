export function labelFromUserAgent(userAgent?: string | null): string {
  if (!userAgent) return "Unknown device";

  if (/Claude/i.test(userAgent)) return "Claude Desktop";

  const osMatch =
    /Mac OS X|Macintosh/i.test(userAgent)
      ? "macOS"
      : /Windows/i.test(userAgent)
        ? "Windows"
        : /Linux/i.test(userAgent)
          ? "Linux"
          : /Android/i.test(userAgent)
            ? "Android"
            : /iPhone|iPad|iOS/i.test(userAgent)
              ? "iOS"
              : null;

  const browserMatch = /Edg\//i.test(userAgent)
    ? "Edge"
    : /Chrome\//i.test(userAgent)
      ? "Chrome"
      : /Safari\//i.test(userAgent)
        ? "Safari"
        : /Firefox\//i.test(userAgent)
          ? "Firefox"
          : null;

  if (browserMatch && osMatch) return `${browserMatch} on ${osMatch}`;
  if (browserMatch) return browserMatch;
  if (osMatch) return osMatch;
  return "Unknown device";
}
