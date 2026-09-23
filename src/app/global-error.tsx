"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * The last resort (T-10 item 1): Next renders this when the root layout
 * itself throws, so it replaces `<html>`/`<body>` and none of the app's
 * providers, fonts or shell exist by the time it runs.
 *
 * It therefore stays deliberately plain — brand colours only, no imports from
 * the app, no theme store (the class can't be read without the provider), no
 * routing beyond a plain anchor. Anything richer risks throwing inside the
 * boundary that is supposed to catch throws.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #F6FAFF 0%, #FFFFFF 60%)",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: "#0A1F4D",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 20px",
              borderRadius: 18,
              background: "linear-gradient(135deg, #063BAA 0%, #0A1F4D 100%)",
            }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
            FinSharpeGPT couldn&rsquo;t start
          </h1>
          <p
            style={{
              margin: "10px 0 24px",
              fontSize: 13,
              lineHeight: 1.6,
              color: "#5A6B8C",
            }}
          >
            Something went wrong before the app could load. Reload to try again
            — your chats and data are untouched.
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 999,
                padding: "10px 20px",
                fontSize: 12,
                fontWeight: 500,
                color: "#FFFFFF",
                background: "linear-gradient(135deg, #063BAA 0%, #0A1F4D 100%)",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: 999,
                padding: "10px 20px",
                fontSize: 12,
                fontWeight: 500,
                color: "#0A1F4D",
                textDecoration: "none",
                border: "1px solid #E4EAF5",
              }}
            >
              Back to chat
            </a>
          </div>
          {error.digest && (
            <p
              style={{
                marginTop: 20,
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#A9B6CE",
              }}
            >
              Ref {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
