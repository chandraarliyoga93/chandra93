"use client";

import { Suspense } from "react";
import { Infinite } from "iconoir-react";
import { motion } from "framer-motion";
import { InteractiveGridPattern } from "@/components/landing/InteractiveGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManualLoginForm from "@/components/auth/ManualLoginForm";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white dark:bg-zinc-950">
      {/* LEFT PANE: Branding Side (Shadboard reference style) */}
      <div className="relative md:basis-1/2 hidden md:flex flex-col items-center justify-center p-12 overflow-hidden bg-zinc-950 border-r border-white/5">
        {/* Shadboard Grid Background */}
        <div className="absolute inset-0 z-0 opacity-[0.1]">
          <InteractiveGridPattern 
            width={60} 
            height={60} 
            squares={[30, 30]} 
            className="text-white"
            squaresClassName="hover:fill-white transition-colors duration-150"
          />
        </div>
        
        {/* Professional Glow */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-zinc-400 blur-[140px] rounded-full"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg space-y-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 font-black text-xl tracking-tighter italic text-white">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-black text-sm font-black">KG</span>
              </div>
              KELAS GURU
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-black tracking-tight leading-[0.9] text-white font-outfit drop-shadow-2xl">
                Modern <br />
                Classroom <br />
                <span className="text-zinc-500">Experience.</span>
              </h1>
              <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md">
                Kelola kelas, presensi, dan penilaian dengan antarmuka yang bersih dan performa maksimal.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex items-center gap-6"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-zinc-900 bg-zinc-800" />
              ))}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Trusted by 100+ Teachers
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANE: Auth Side (Clean Shadboard) */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 md:p-12">
        {/* Mobile Header (Hidden on MD) */}
        <div className="md:hidden absolute top-8 left-8 flex items-center gap-2 font-black text-sm tracking-tighter italic">
          <div className="w-6 h-6 bg-zinc-950 dark:bg-zinc-50 rounded flex items-center justify-center">
            <span className="text-white dark:text-black text-[10px]">KG</span>
          </div>
          KELAS GURU
        </div>

        <div className="w-full max-w-[24rem] space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Sign In</h2>
            <p className="text-zinc-500 text-sm font-medium">Masuk ke akun Anda untuk melanjutkan.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense fallback={
              <div className="flex justify-center p-12">
                <Infinite className="animate-spin h-8 w-8 text-zinc-400" />
              </div>
            }>
              <Tabs defaultValue="Guru" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <TabsTrigger 
                    value="Guru" 
                    className="rounded-md font-bold text-xs transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm"
                  >
                    GURU
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Siswa" 
                    className="rounded-md font-bold text-xs transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:shadow-sm"
                  >
                    SISWA
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-8 space-y-6">
                  <TabsContent value="Guru" className="space-y-8">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">Masuk dengan Email & Password</p>
                        <ManualLoginForm role="Guru" />
                      </div>
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="Siswa" className="space-y-8">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">Masuk dengan ID Siswa</p>
                        <ManualLoginForm role="Siswa" />
                      </div>
                    </motion.div>
                  </TabsContent>
                </div>
              </Tabs>
            </Suspense>
          </motion.div>

          <p className="text-[10px] text-center text-zinc-400 font-medium">
            By continuing, you agree to our <span className="underline underline-offset-4 cursor-pointer hover:text-zinc-600">Terms of Service</span> and <span className="underline underline-offset-4 cursor-pointer hover:text-zinc-600">Privacy Policy</span>.
          </p>
        </div>

        {/* Footer Credit */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-8 flex items-center gap-3 text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-300 dark:text-zinc-700"
        >
          <span>&copy; 2026 KELAS GURU</span>
          <div className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <span>IPADEVPRO</span>
        </motion.div>
      </div>
    </div>
  );
}
