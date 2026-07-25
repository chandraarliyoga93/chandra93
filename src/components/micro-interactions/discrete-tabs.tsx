"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface DiscreteTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  variant?: "guru" | "siswa";
}

export function DiscreteTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = "siswa",
}: DiscreteTabsProps) {
  return (
    <div
      className={cn(
        "flex p-1 gap-1",
        variant === "guru" 
          ? "rounded-lg border bg-muted/50" 
          : "rounded-xl border-4 border-neo-border bg-neo-bg shadow-[4px_4px_0px_0px_var(--neo-border)]",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-bold transition-colors outline-none",
              isActive 
                ? (variant === "guru" ? "text-foreground" : "text-foreground")
                : (variant === "guru" ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:text-foreground")
            )}
          >
            {isActive && (
              <motion.div
                layoutId={variant === "guru" ? "active-tab-guru" : "active-tab-siswa"}
                className={cn(
                  "absolute inset-0 z-0",
                  variant === "guru"
                    ? "rounded-md bg-background shadow-sm"
                    : "rounded-lg border-2 border-neo-border bg-yellow-400 dark:bg-yellow-600 shadow-[2px_2px_0px_0px_var(--neo-border)]"
                )}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {Icon && <Icon className="size-4" />}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
