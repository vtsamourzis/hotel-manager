export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--canvas)",
      padding: "max(env(safe-area-inset-top, 0px), 24px) 16px 24px",
    }}>
      {children}
    </div>
  )
}
