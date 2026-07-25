"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { Medal, Flash, Coins, Home, Lock } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ExamResultProps {
  score: number;
  xpReward: number;
  coinReward: number;
  leveledUp: boolean;
  newLevel: number;
  badgesAwarded: number;
  showScore?: boolean;
}

function NumberTicker({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span>
      {prefix}{displayValue.toLocaleString()}
    </span>
  );
}

export function ExamResult({
  score,
  xpReward,
  coinReward,
  leveledUp,
  newLevel,
  badgesAwarded,
  showScore = true,
}: ExamResultProps) {
  const router = useRouter();
  const [showLevelUp, setShowLevelUp] = useState(leveledUp);

  useEffect(() => {
    if (leveledUp) {
      const timer = setTimeout(() => {
        setShowLevelUp(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [leveledUp]);

  return (
    <div className="fixed inset-0 z-[200] bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Level Up Pop-in Overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0, rotate: 10 }}
            className="fixed inset-0 z-[300] bg-yellow-400 flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <Flash className="w-32 h-32 text-black mb-4" />
            </motion.div>
            <h2 className="text-7xl sm:text-9xl font-black text-black leading-none italic uppercase tracking-tighter">
              LEVEL UP!
            </h2>
            <div className="bg-black text-white px-8 py-4 mt-4 text-4xl font-black skew-x-[-12deg]">
              KE LEVEL {newLevel}
            </div>
            <p className="mt-8 text-black text-xl font-black uppercase tracking-widest">GOKIL BANGET KAMU!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: leveledUp ? 3.2 : 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white dark:bg-zinc-950 border-4 border-black dark:border-zinc-100 p-8 sm:p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.15)] relative overflow-hidden">
          {/* Background Decorative Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 border-l-4 border-b-4 border-black -mr-10 -mt-10 rotate-45" />
          
          <div className="relative z-10 text-center space-y-8">
            {/* Score Header */}
            {showScore ? (
              <div>
                <p className="text-neutral-500 dark:text-zinc-400 font-black uppercase tracking-widest mb-1">HASIL AKHIR</p>
                <h1 className="text-8xl font-black text-black dark:text-zinc-100 leading-none tabular-nums italic tracking-tighter">
                  {score}
                </h1>
              </div>
            ) : (
              <div>
                <div className="bg-zinc-200 dark:bg-zinc-800 border-4 border-black dark:border-zinc-100 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] inline-block">
                  <Lock className="w-16 h-16 text-zinc-500 dark:text-zinc-300 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-zinc-700 dark:text-zinc-100 uppercase italic tracking-tighter">NILAI BELUM DIRILIS</h2>
                </div>
              </div>
            )}

            {/* Badge Celebration Section */}
            {badgesAwarded > 0 && (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1.1, 1] }}
                transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
                className="bg-purple-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <Medal className="w-16 h-16 text-black" />
                </motion.div>
                <h3 className="text-2xl font-black text-black uppercase leading-none mt-2">
                  TOTAL {badgesAwarded} BADGE BARU!
                </h3>
              </motion.div>
            )}

            {/* Rewards Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-blue-400 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
                <Flash className="w-10 h-10 text-black mb-2" />
                <p className="font-black text-black uppercase tracking-tighter mb-1">XP REWARD</p>
                <div className="text-3xl font-black text-black tabular-nums">
                  <NumberTicker value={xpReward} prefix="+" />
                </div>
              </div>
              <div className="bg-green-400 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
                <Coins className="w-10 h-10 text-black mb-2" />
                <p className="font-black text-black uppercase tracking-tighter mb-1">GURUCOIN</p>
                <div className="text-3xl font-black text-black tabular-nums">
                  <NumberTicker value={coinReward} prefix="+" />
                </div>
              </div>
            </div>

            {/* Feedback Message */}
            <div className="py-4">
              <h4 className="text-2xl font-black text-black dark:text-zinc-100 uppercase italic leading-none">
                {score >= 80 ? "GILA! MANTAP BANGET!" : score >= 60 ? "KEREN! TERUSIN YA!" : "YUK, BELAJAR LAGI!"}
              </h4>
              <p className="font-bold text-neutral-600 dark:text-zinc-300 mt-2 uppercase text-sm tracking-tight">
                Semua progres kamu sudah tersimpan secara permanen.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4">
              <Button
                onClick={() => router.push("/dashboard/siswa")}
                className="w-full bg-black text-white border-4 border-black h-20 font-black text-2xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-none uppercase flex gap-3"
              >
                <Home className="w-8 h-8" />
                BALIK KE DASHBOARD
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
