"use client";

import { PageHeader } from "@/components/app-shell";
import { HistoryView } from "@/components/history-view";
import { useProfile } from "@/components/profile-gate";

export default function HistoryPage() {
  const { profile } = useProfile();
  return (
    <>
      <PageHeader title="Histórico" subtitle="Cada treino feito, com cargas e séries." />
      <HistoryView userId={profile.id} />
    </>
  );
}
