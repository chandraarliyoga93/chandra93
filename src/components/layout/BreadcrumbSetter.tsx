"use client";

import { useEffect } from "react";
import { useBreadcrumb } from "./BreadcrumbContext";

export function BreadcrumbSetter({ segment, label }: { segment: string, label: string }) {
  const { setLabel } = useBreadcrumb();

  useEffect(() => {
    setLabel(segment, label);
  }, [segment, label, setLabel]);

  return null;
}
