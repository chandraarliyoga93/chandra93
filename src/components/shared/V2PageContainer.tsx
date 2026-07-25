import { cn } from "@/lib/utils"

interface V2PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function V2PageContainer({ children, className, ...props }: V2PageContainerProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-4 p-0 md:p-2", className)} {...props}>
      {children}
    </div>
  )
}
