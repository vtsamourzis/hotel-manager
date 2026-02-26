"use client"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 1rem",
      textAlign: "center" as const,
      minHeight: "50vh",
    }}>
      <h2 style={{
        fontSize: "1.25rem",
        fontWeight: 600,
        color: "hsl(198, 72%, 24%)",
        marginBottom: "0.5rem",
      }}>
        {"\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7\u03C2"}
      </h2>
      <p style={{
        color: "hsl(220, 10%, 40%)",
        marginBottom: "1.5rem",
        maxWidth: "360px",
        lineHeight: 1.5,
      }}>
        {"\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03B1\u03C5\u03C4\u03AE\u03C2 \u03C4\u03B7\u03C2 \u03C3\u03B5\u03BB\u03AF\u03B4\u03B1\u03C2. \u0394\u03BF\u03BA\u03B9\u03BC\u03AC\u03C3\u03C4\u03B5 \u03BE\u03B1\u03BD\u03AC \u03AE \u03B5\u03C0\u03B9\u03C3\u03C4\u03C1\u03AD\u03C8\u03C4\u03B5 \u03C3\u03C4\u03B7\u03BD \u03B1\u03C1\u03C7\u03B9\u03BA\u03AE."}
      </p>
      {error.digest && (
        <p style={{
          fontSize: "0.75rem",
          color: "hsl(220, 10%, 60%)",
          marginBottom: "1rem",
          fontFamily: "monospace",
        }}>
          {"\u039A\u03C9\u03B4\u03B9\u03BA\u03CC\u03C2: "}{error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={reset}
          style={{
            backgroundColor: "hsl(198, 72%, 24%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "0.5rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {"\u0394\u03BF\u03BA\u03B9\u03BC\u03AC\u03C3\u03C4\u03B5 \u03BE\u03B1\u03BD\u03AC"}
        </button>
        <a
          href="/overview"
          style={{
            backgroundColor: "transparent",
            color: "hsl(198, 72%, 24%)",
            border: "1px solid hsl(198, 72%, 24%)",
            borderRadius: "8px",
            padding: "0.5rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {"\u0391\u03C1\u03C7\u03B9\u03BA\u03AE"}
        </a>
      </div>
    </div>
  )
}
