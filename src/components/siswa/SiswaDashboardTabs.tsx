"use client";

import * as React from "react";
import { DiscreteTabs } from "@/components/micro-interactions/discrete-tabs";
import { ViewGrid, StatsUpSquare, Medal } from "iconoir-react";
import { useQueryState, parseAsString } from "nuqs";

export function SiswaDashboardTabs() {
  const [activeTab, setActiveTab] = useQueryState(
    "view",
    parseAsString.withDefault("classes")
  );

  const tabs = [
    { id: "classes", label: "Classes", icon: ViewGrid },
    { id: "stats", label: "Stats", icon: StatsUpSquare },
    { id: "badges", label: "Badges", icon: Medal },
  ];

  return (
    <div className="mb-8 max-w-md">
      <DiscreteTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id)}
        variant="siswa"
      />
    </div>
  );
}
