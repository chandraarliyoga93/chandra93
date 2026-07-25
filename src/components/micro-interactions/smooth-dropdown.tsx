"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";

interface SmoothDropdownProps {
  trigger: React.ReactNode | ((props: { isOpen: boolean }) => React.ReactNode);
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  align?: "left" | "right";
}

export function SmoothDropdown({
  trigger,
  children,
  className,
  contentClassName,
  align = "right",
}: SmoothDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [ref, { height }] = useMeasure();
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative inline-block w-full", className)} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {typeof trigger === "function" ? trigger({ isOpen }) : trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: height > 0 ? height : "auto"
            }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              height: {
                type: "spring",
                stiffness: 300,
                damping: 30,
              }
            }}
            className={cn(
              "absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg",
              align === "right" ? "right-0" : "left-0",
              contentClassName
            )}
          >
            <div ref={ref} className="p-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SmoothDropdownItem({
  children,
  onClick,
  className,
  icon: Icon,
  destructive,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ElementType;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
        destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive",
        className
      )}
    >
      {Icon && <Icon className="size-4" />}
      {children}
    </button>
  );
}
