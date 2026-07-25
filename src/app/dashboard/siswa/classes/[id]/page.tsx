import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default async function SiswaClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Unified dashboard uses search params now
  redirect(`/dashboard/siswa?classId=${id}`);
}
