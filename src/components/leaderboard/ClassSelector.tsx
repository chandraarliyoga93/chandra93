"use client";

import { useQueryState, parseAsString } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ClassSelectorProps {
  classes: { id: string; name: string }[];
}

export function ClassSelector({ classes }: ClassSelectorProps) {
  const [classId, setClassId] = useQueryState(
    "classId",
    parseAsString.withDefault("global").withOptions({
      shallow: false,
    })
  );

  return (
    <div className={cn("w-full max-w-[200px]")}>
      <Select value={classId} onValueChange={setClassId}>
        <SelectTrigger className={cn("w-full h-9 bg-background")}>
          <SelectValue placeholder="Pilih Kelas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="global">Global</SelectItem>
          {classes.map((cls) => (
            <SelectItem key={cls.id} value={cls.id}>
              {cls.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
