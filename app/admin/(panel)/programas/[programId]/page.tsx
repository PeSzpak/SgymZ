"use client";

import { use } from "react";
import { ProgramEditor } from "@/components/program-editor";

export default function AdminProgramPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = use(params);
  return <ProgramEditor programId={programId} backHref="/admin/programas" />;
}
