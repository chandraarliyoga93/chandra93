"use client";

import * as React from "react";
import { Check, NavArrowDown, Xmark } from "iconoir-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Passage } from "@/types/exam";

interface PassageSelectorProps {
  value: string | null;
  onChange: (id: string | null) => void;
  passages: Passage[];
}

export function PassageSelector({ value, onChange, passages }: PassageSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedPassage = passages.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-11"
        >
          <span className="truncate">
            {selectedPassage ? selectedPassage.title : "Pilih wacana / bacaan..."}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-transparent text-zinc-400 hover:text-zinc-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                <Xmark className="h-3 w-3" />
              </Button>
            )}
            <NavArrowDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Cari wacana..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <p className="py-6 text-center text-sm text-zinc-500">Wacana tidak ditemukan</p>
            </CommandEmpty>
            <CommandGroup heading="Daftar Wacana">
              <CommandItem
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="flex items-center justify-between"
              >
                Tanpa Wacana
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
              {passages.map((passage) => (
                <CommandItem
                  key={passage.id}
                  value={passage.title}
                  onSelect={() => {
                    onChange(passage.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="truncate mr-2">{passage.title}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      value === passage.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
