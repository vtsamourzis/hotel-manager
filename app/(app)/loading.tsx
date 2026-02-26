/**
 * Shared loading skeleton for all (app) routes.
 *
 * Renders instantly on tab switch while server components fetch.
 * Uses inline styles to avoid CSS module dependency — loading must
 * render before any component CSS is guaranteed to be ready.
 */
export default function AppLoading() {
  return (
    <div
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        animation: "appLoadingPulse 1.4s ease-in-out infinite",
      }}
    >
      {/* Title bar skeleton */}
      <div
        style={{
          height: 24,
          width: "40%",
          borderRadius: 6,
          background: "var(--border-2, hsl(220, 10%, 85%))",
        }}
      />

      {/* Content block skeletons */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: "1 1 calc(50% - 0.5rem)",
              minWidth: 140,
              height: 100,
              borderRadius: 8,
              border: "1px solid var(--border-1, hsl(220, 10%, 90%))",
              background: "var(--surface-1, hsl(33, 18%, 95%))",
            }}
          />
        ))}
      </div>

      {/* More content lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div
          style={{
            height: 14,
            width: "80%",
            borderRadius: 4,
            background: "var(--border-2, hsl(220, 10%, 85%))",
          }}
        />
        <div
          style={{
            height: 14,
            width: "60%",
            borderRadius: 4,
            background: "var(--border-2, hsl(220, 10%, 85%))",
          }}
        />
      </div>

      <style>{`
        @keyframes appLoadingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
