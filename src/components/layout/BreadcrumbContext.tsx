"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type BreadcrumbContextType = {
  labels: Record<string, string>;
  setLabel: (segment: string, label: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = (segment: string, label: string) => {
    setLabels(prev => {
      // Only update if changed to avoid loops
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
  };

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}
