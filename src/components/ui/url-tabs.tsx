"use client";

import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { progressBar } from "@/lib/progress-bar";

interface URLTabsProps {
  defaultValue: string;
  paramName?: string;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  indicatorClassName?: string;
  tabs: {
    value: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }[];
}

export function URLTabs({ 
  defaultValue, 
  paramName = "tab", 
  className,
  listClassName,
  triggerClassName,
  indicatorClassName,
  tabs 
}: URLTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentValue = searchParams.get(paramName) || defaultValue;

  const handleValueChange = (value: string) => {
    progressBar.start();
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    // If we switch main tabs, we might want to reset sub-views
    if (paramName === "tab") {
      params.delete("view");
      params.delete("taskId");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <ShadcnTabs 
      value={currentValue} 
      onValueChange={handleValueChange} 
      className={cn("space-y-6", className)}
    >
      <TabsList className={cn("flex w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-hide", listClassName)}>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value} 
            className={cn(
              "relative z-10 flex-shrink-0 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent",
              triggerClassName
            )}
          >
            {tab.value === currentValue && (
              <motion.div
                layoutId={`url-tabs-indicator-${paramName}`}
                className={cn(
                  "absolute inset-0 z-[0] rounded-md bg-background shadow-sm dark:bg-muted/80",
                  indicatorClassName
                )}
                transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent 
          key={tab.value} 
          value={tab.value} 
          className="outline-none"
        >
          {tab.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
}
