"use client";

import { Announcement } from "@/actions/announcements-supabase";
import { Megaphone } from "iconoir-react";
import { motion } from "framer-motion";

interface SocialBannerProps {
  announcements: Announcement[];
}

export function SocialBanner({ announcements }: SocialBannerProps) {
  // Combine all messages into one long string for the marquee
  const combinedMessages = announcements
    .map((a) => `${a.authorName}: "${a.message}"`)
    .join("  •  ");

  return (
    <div className="relative w-full overflow-hidden border-y-4 border-neo-border bg-neo-accent py-3 shadow-[0px_4px_0px_0px_var(--neo-border)]">
      <div className="flex items-center">
        {/* Fixed Icon Label */}
        <div className="z-10 flex items-center gap-2 bg-neo-accent px-4 font-black uppercase italic tracking-tighter text-black border-r-4 border-neo-border shrink-0">
          <Megaphone className="h-5 w-5 stroke-[2.5]" />
          <span>Gossip Kelas</span>
        </div>

        {/* Marquee Content */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              duration: 20,
              ease: "linear",
              repeat: Infinity,
            }}
            className="flex whitespace-nowrap"
          >
            <span className="inline-block px-4 text-sm font-black uppercase italic tracking-tight text-black">
              {combinedMessages}
            </span>
            <span className="inline-block px-4 text-sm font-black uppercase italic tracking-tight text-black">
              {combinedMessages}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
