"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumb } from "./BreadcrumbContext";
import { cn } from "@/lib/utils";

const ROUTE_MAPPING: Record<string, string> = {
  classes: "Manajemen Kelas",
  courses: "Mata Pelajaran",
  students: "Siswa",
  teachers: "Guru",
  settings: "Pengaturan",
  profile: "Profil",
  schedule: "Jadwal",
  materials: "Materi",
  assignments: "Tugas",
  grades: "Nilai",
  attendance: "Absensi",
  analytics: "Analitik",
  calendar: "Kalender",
};

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const { labels } = useBreadcrumb();
  
  const pathSegments = pathname.split("/").filter(Boolean);
  const isSiswa = pathname.startsWith("/dashboard/siswa");
  
  const crumbs = pathSegments.map((segment, index) => {
    // Build the href for this segment
    let href = `/${pathSegments.slice(0, index + 1).join("/")}`;
    
    // Default label: Capitalize and replace hyphens
    let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    let hidden = false;

    // Special handling for "dashboard"
    if (segment === "dashboard") {
      label = "Dashboard";
      // If next segment is guru or siswa, point Dashboard link to that role's home
      const nextSegment = pathSegments[index + 1];
      if (nextSegment === "guru" || nextSegment === "siswa") {
        href = `/dashboard/${nextSegment}`;
      }
    }
    
    // Hide role and version segments from the breadcrumb trail visually
    // The "Dashboard" link essentially acts as the root for these roles
    if (segment === "guru" || segment === "siswa") {
      hidden = true;
    }
    
    // Apply static mappings
    if (ROUTE_MAPPING[segment]) {
      label = ROUTE_MAPPING[segment];
    }
    
    // Apply dynamic mappings from context (overrides everything else)
    if (labels[segment]) {
      label = labels[segment];
    }

    return { href, label, hidden, segment };
  });

  // Filter out hidden crumbs
  const visibleCrumbs = crumbs.filter(c => !c.hidden);

  // If we only have "Dashboard" (or empty), and we are at /dashboard/guru or /dashboard/siswa, 
  // we might want to show "Dashboard" as active page or nothing?
  // Usually Dashboard is the root.
  
  if (visibleCrumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {visibleCrumbs.map((crumb, index) => {
          const isLast = index === visibleCrumbs.length - 1;
          
          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage className={cn(
                    "font-medium",
                    isSiswa && "font-black uppercase italic tracking-tighter text-black"
                  )}>
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink 
                    href={crumb.href}
                    className={cn(
                      "transition-colors hover:text-foreground",
                      isSiswa && "font-black uppercase italic tracking-tighter text-slate-500 hover:text-black"
                    )}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
