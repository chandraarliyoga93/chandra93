"use client";

import { ClassData } from "@/actions/classes-supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface JournalFilterProps {
  classes: ClassData[];
  currentClassId: string;
}

export function JournalFilter({ classes, currentClassId }: JournalFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("classId");
    } else {
      params.set("classId", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentClassId} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Pilih Kelas" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          Semua Kelas
        </SelectItem>
        {classes.map((cls) => (
          <SelectItem
            key={cls.id}
            value={cls.id}
          >
            {cls.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
