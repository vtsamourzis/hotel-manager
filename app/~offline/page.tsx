export default function OfflineFallbackPage() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "hsl(33, 18%, 91%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid hsl(198, 72%, 24%)",
          borderTopColor: "transparent",
          animation: "ha-spin 0.9s linear infinite",
          marginBottom: "0.5rem",
        }}
      />

      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "hsl(210, 6%, 15%)",
          margin: 0,
        }}
      >
        {"Εκτός σύνδεσης"}
      </h2>

      <p
        style={{
          fontSize: "0.875rem",
          color: "hsl(210, 4%, 35%)",
          margin: 0,
        }}
      >
        {"Η εφαρμογή δεν μπορεί να συνδεθεί στον server."}
      </p>

      <p
        style={{
          fontSize: "0.8125rem",
          color: "hsl(210, 4%, 35%)",
          margin: 0,
          opacity: 0.75,
        }}
      >
        {"Θα επανασυνδεθεί αυτόματα."}
      </p>

      <style>{`
        @keyframes ha-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
