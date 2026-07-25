"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Calendar as CalendarIcon, NavArrowDown } from "iconoir-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface V2DatePickerProps {
  date?: Date
  setDate?: (date: Date | undefined) => void
  className?: string
  placeholder?: string
}

export function V2DatePicker({ 
  date: propsDate, 
  setDate: propsSetDate, 
  className, 
  placeholder = "Pilih tanggal..." 
}: V2DatePickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const dateParam = searchParams.get("date")
  const initialDate = React.useMemo(() => {
    if (propsDate) return propsDate
    if (dateParam) return parseISO(dateParam)
    return new Date()
  }, [propsDate, dateParam])

  const [internalDate, setInternalDate] = React.useState<Date | undefined>(initialDate)

  // Sync internal state with URL/Props
  React.useEffect(() => {
    setInternalDate(initialDate)
  }, [initialDate])

  const handleSelect = (selectedDate: Date | undefined) => {
    setInternalDate(selectedDate)
    
    if (propsSetDate) {
      propsSetDate(selectedDate)
    }

    if (selectedDate) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("date", format(selectedDate, "yyyy-MM-dd"))
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "h-11 justify-start text-left font-normal rounded-2xl border-zinc-200/50 bg-white/50 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-950/50 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900",
            !internalDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
          <span className="flex-1 font-medium">
            {internalDate ? (
              format(internalDate, "dd MMMM yyyy", { locale: idLocale })
            ) : (
              <span>{placeholder}</span>
            )}
          </span>
          <NavArrowDown className="ml-2 h-4 w-4 text-zinc-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-[1.5rem] border-zinc-200/50 shadow-2xl" align="start">
        <Calendar
          mode="single"
          selected={internalDate}
          onSelect={handleSelect}
          initialFocus
          locale={idLocale}
          className="rounded-[1.5rem]"
        />
      </PopoverContent>
    </Popover>
  )
}
