import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  scrollable?: boolean
  className?: string
  /** Kelas pada wrapper konten bagian dalam (padding, tinggi, dll.). */
  innerClassName?: string
}

export default function PageContainer({
  children,
  scrollable = true,
  className,
  innerClassName,
}: PageContainerProps) {
  const innerPad = cn("p-4 md:px-6 md:py-8", innerClassName)
  return (
    <div className={cn("h-[calc(100vh-64px)] w-full overflow-hidden bg-background", className)}>
      {scrollable ? (
        <ScrollArea className="h-full">
          <div className={innerPad}>
            {children}
          </div>
        </ScrollArea>
      ) : (
        <div className={cn("h-full", innerPad)}>
          {children}
        </div>
      )}
    </div>
  )
}
