import { getExamBasicInfoSupabase } from "@/actions/exam-supabase";
import { ExamLobbyClient } from "@/components/cbt/ExamLobbyClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

interface ExamLobbyPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExamLobbyPage({ params }: ExamLobbyPageProps) {
  const { id } = await params;
  
  const result = await getExamBasicInfoSupabase(id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="w-full">
      <ExamLobbyClient exam={result.data as any} />
    </div>
  );
}
