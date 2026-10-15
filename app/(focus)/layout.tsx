"use client";

import { ProfileGate } from "@/components/profile-gate";

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileGate>
      <div className="app-backdrop" />
      {children}
    </ProfileGate>
  );
}
