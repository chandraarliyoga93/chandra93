"use client"

import { CheckCircle, InfoCircle, Infinite, XmarkCircle, WarningTriangle } from "iconoir-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { cn } from "@/lib/utils"

const Toaster = ({ richColors, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const pathname = usePathname()
  const isSiswa = pathname?.includes("/siswa")

  const iconClass = cn(isSiswa ? "size-6 stroke-[2.5]" : "size-4")

  return (
    <Sonner
      key={isSiswa ? "siswa-toaster" : "guru-toaster"}
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Disable richColors for Siswa to take full control of the card styling
      richColors={isSiswa ? false : richColors}
      icons={{
        success: <CheckCircle className={cn(iconClass, isSiswa && "text-[oklch(0.87_0.2_115)]")} />,
        info: <InfoCircle className={cn(iconClass, isSiswa && "text-[oklch(0.45_0.23_267.07)]")} />,
        warning: <WarningTriangle className={cn(iconClass, isSiswa && "text-yellow-400")} />,
        error: <XmarkCircle className={cn(iconClass, isSiswa && "text-destructive")} />,
        loading: <Infinite className={cn(iconClass, "animate-spin")} />,
      }}
      toastOptions={{
        className: cn(
          "group toast",
          isSiswa 
            ? "!bg-[var(--neo-bg)] !text-[var(--foreground)] !border-4 !border-[var(--neo-border)] !shadow-[var(--neo-shadow-sm)] !rounded-none !p-4 !font-gen-z" 
            : "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg"
        ),
        descriptionClassName: cn(isSiswa ? "!text-muted-foreground !font-medium" : "group-[.toast]:text-muted-foreground"),
        actionButtonStyle: isSiswa 
          ? { 
              borderRadius: "0px", 
              border: "2px solid var(--neo-border)",
              boxShadow: "2px 2px 0px 0px var(--neo-border)",
              backgroundColor: "var(--neo-primary)",
              color: "white",
              fontWeight: "900",
              textTransform: "uppercase",
              fontSize: "12px",
              padding: "0 12px"
            } 
          : undefined,
      }}
      {...props}
    />
  )
}

export { Toaster }
