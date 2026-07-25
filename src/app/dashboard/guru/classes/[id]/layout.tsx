import React from "react";
import { getClassByIdSupabase as getClassById } from "@/actions/classes-supabase";
import { notFound } from "next/navigation";
import { BreadcrumbSetter } from "@/components/layout/BreadcrumbSetter";
import { V2ClassTabs } from "@/components/classes/V2ClassTabs";
import { V2PageContainer } from "@/components/shared/V2PageContainer";

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classData = await getClassById(id);

  if (!classData) {
    notFound();
  }

  return (
    <V2PageContainer>
      <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <BreadcrumbSetter segment={id} label={classData.name} />
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-zinc-50 uppercase italic">
              {classData.name}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              {classData.description || "Manage your class activities and student data."}
            </p>
          </div>
          
          <V2ClassTabs classId={id} />
        </div>

        <div className="flex-1">
          {children}
        </div>
      </div>
    </V2PageContainer>
  );
}
