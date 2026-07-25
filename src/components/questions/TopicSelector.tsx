"use client";

import * as React from "react";
import { Check, NavArrowDown, Plus } from "iconoir-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface TopicSelectorProps {
  value: string;
  onChange: (value: string) => void;
  existingTopics: string[];
}

export function TopicSelector({ value, onChange, existingTopics }: TopicSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [newTopic, setNewTopic] = React.useState("");
  const [search, setSearch] = React.useState("");

  const handleSelect = (currentValue: string) => {
    onChange(currentValue);
    setOpen(false);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    if (newTopic.trim()) {
      onChange(newTopic.trim());
      setNewTopic("");
      setIsAddingNew(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? value : "Pilih atau buat topik..."}
          <NavArrowDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {isAddingNew ? (
          <div className="p-3 space-y-3">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nama Topik Baru</p>
              <Input
                autoFocus
                placeholder="Misal: Sistem Reproduksi"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNew();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleAddNew}>
                Simpan
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsAddingNew(false)}
              >
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <Command>
            <CommandInput 
              placeholder="Cari topik..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 px-4 text-center">
                   <p className="text-sm text-zinc-500 mb-3">Topik tidak ditemukan</p>
                   <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-full gap-2"
                    onClick={() => {
                      setNewTopic(search);
                      setIsAddingNew(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Buat "{search}"
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup heading="Topik Terdaftar">
                {existingTopics.map((topic) => (
                  <CommandItem
                    key={topic}
                    value={topic}
                    onSelect={() => handleSelect(topic)}
                    className="flex items-center justify-between"
                  >
                    {topic}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === topic ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => setIsAddingNew(true)}
                  className="flex items-center gap-2 text-primary font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Topik Baru
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
