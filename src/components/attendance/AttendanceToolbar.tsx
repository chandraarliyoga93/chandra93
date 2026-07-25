"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  Search, NavArrowLeft, NavArrowRight, Calendar as CalendarIcon, Xmark } from "iconoir-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, subDays, parseISO, isAfter, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { progressBar } from "@/lib/progress-bar";

export function AttendanceToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const queryParam = searchParams.get("q") || "";

  const [search, setSearch] = React.useState(queryParam);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const currentParams = new URLSearchParams(searchParams.toString());
      const currentQ = currentParams.get("q") || "";
      
      if (search === currentQ) return;

      if (search) {
        currentParams.set("q", search);
      } else {
        currentParams.delete("q");
      }
      router.push(`${pathname}?${currentParams.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, pathname, router, searchParams]);

  const updateDate = (newDate: Date) => {
    progressBar.start();
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(newDate, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrevDay = () => {
    const currentDate = parseISO(dateParam);
    updateDate(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    const currentDate = parseISO(dateParam);
    const nextDate = addDays(currentDate, 1);
    
    // Don't allow future dates if we want to be strict in UI too
    if (isAfter(startOfDay(nextDate), startOfDay(new Date()))) return;
    
    updateDate(nextDate);
  };

  const isNextDisabled = isAfter(
    startOfDay(addDays(parseISO(dateParam), 1)), 
    startOfDay(new Date())
  );

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-card p-4 rounded-2xl shadow-sm border border-border/50 transition-colors">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Cari nama siswa…"
          aria-label="Cari nama siswa"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-xl font-medium"
        />
        {search && (
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
          >
            <Xmark className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-9 w-9 text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm rounded-lg transition-all"
          >
            <NavArrowLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-3 text-sm font-bold text-foreground hover:bg-card hover:shadow-sm min-w-[140px] justify-center rounded-lg"
              >
                <CalendarIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>
                  {format(parseISO(dateParam), "eee, d MMM", { locale: localeId })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={parseISO(dateParam)}
                onSelect={(date) => date && updateDate(date)}
                disabled={(date) => isAfter(date, new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={isNextDisabled}
            className="h-9 w-9 text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm rounded-lg transition-all disabled:opacity-20"
          >
            <NavArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => updateDate(new Date())}
          className={cn(
            "h-11 px-4 rounded-xl font-bold border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95",
            dateParam === format(new Date(), "yyyy-MM-dd") && "hidden"
          )}
        >
          Hari Ini
        </Button>
      </div>
    </div>
  );
}
