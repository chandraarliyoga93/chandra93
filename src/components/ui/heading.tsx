import * as React from "react";

interface HeadingProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function Heading({ title, description, icon }: HeadingProps) {
  return (
    <div className="space-y-1.5 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            {icon}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground/90">
          {title}
        </h1>
      </div>
      {description && (
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
