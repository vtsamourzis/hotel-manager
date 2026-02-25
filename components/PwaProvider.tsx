"use client";
import { SerwistProvider } from "@serwist/turbopack/react";
import { useSwUpdate } from "@/lib/hooks/useSwUpdate";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useSwUpdate();
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      {children}
    </SerwistProvider>
  );
}
