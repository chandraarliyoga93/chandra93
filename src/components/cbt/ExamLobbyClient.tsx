"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { verifyExamTokenSupabase, startExamAttemptSupabase } from "@/actions/exam-supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, Flash, CheckCircle, Page } from "iconoir-react";
import { toast } from "sonner";
import { Exam } from "@/types/exam";
import { ExamSession } from "./ExamSession";

interface ExamLobbyClientProps {
  exam: {
    id: string;
    title: string;
    type: string;
    duration: number;
    status: string;
    questions?: any[];
  };
}

export function ExamLobbyClient({ exam }: ExamLobbyClientProps) {
  const [token, setToken] = useState<string[]>(new Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [fullExamData, setFullExamData] = useState<Exam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle Input Focus
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !token[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]; // Only take last char
    
    const newToken = [...token];
    newToken[index] = value.toUpperCase();
    setToken(newToken);
    setError(null);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Trigger verification when 6 chars are filled
  useEffect(() => {
    const fullToken = token.join("");
    if (fullToken.length === 6) {
      handleVerify(fullToken);
    }
  }, [token]);

  const handleVerify = async (tokenString: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyExamTokenSupabase(exam.id, tokenString);
      if (result.success && result.data) {
        setFullExamData(result.data as Exam);
        setIsVerified(true);
        toast.success("Token Valid! Siap Tempur!");
      } else {
        setError(result.error || "Token Salah!");
        toast.error(result.error || "Token Salah!");
        // Clear token on error after short delay
        setTimeout(() => {
          setToken(new Array(6).fill(""));
          inputRefs.current[0]?.focus();
        }, 500);
      }
    } catch (err) {
      console.error("Verification error detail:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem.";
      setError(`Sistem Error: ${msg.substring(0, 50)}…`);
      toast.error("Gagal terhubung ke server.");
    } finally {
      setIsVerifying(false);
    }
  };

  const startExam = async () => {
    if (!fullExamData) return;
    
    try {
      // Request fullscreen early via user gesture if required
      if (fullExamData.settings?.antiCheat?.forceFullscreen) {
        const element = document.documentElement as any;
        const requestMethod = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
        if (requestMethod) requestMethod.call(element).catch(console.error);
      }

      const result: any = await startExamAttemptSupabase(exam.id);
      if (result?.success) {
        const createdId: string | undefined = result.id;
        if (createdId) {
          setAttemptId(createdId);
        }
        toast.info("Memulai Ujian… Semoga Berhasil!");
        setIsStarted(true);
      } else {
        toast.error(result.error || "Gagal memulai sesi ujian.");
      }
    } catch (err) {
      console.error("Start exam error:", err);
      toast.error("Terjadi kesalahan sistem.");
    }
  };

  if (isStarted && fullExamData) {
    return <ExamSession exam={fullExamData} attemptId={attemptId || undefined} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-2xl mx-auto space-y-8">
      {/* Header Info */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 p-3 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Flash className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight">{exam.title}</h1>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 bg-blue-400/20 px-4 py-2 border-2 border-black rounded-full font-bold">
                <Timer className="w-5 h-5" />
                <span>{exam.duration} Menit</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-400/20 px-4 py-2 border-2 border-black rounded-full font-bold">
                <CheckCircle className="w-5 h-5" />
                <span>{exam.type.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 bg-orange-400/20 px-4 py-2 border-2 border-black rounded-full font-bold">
                <Page className="w-5 h-5" />
                <span>{(exam.questions || []).length} Soal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Token Gate / Start Button */}
      <div className="w-full min-h-[250px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isVerified ? (
            <motion.div
              key="token-gate"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
              className="w-full bg-yellow-300 border-4 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-widest">Input Token</h2>
                <p className="font-bold text-black/60 uppercase text-xs tracking-tighter">Mintalah token kepada Guru Pengawas</p>
              </div>

              <div className="flex gap-2 sm:gap-4">
                {token.map((digit, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    animate={digit ? { y: [0, -10, 0], transition: { duration: 0.2 } } : {}}
                  >
                      <input
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        aria-label={`Digit ${idx + 1} dari token`}
                        onChange={(e) => handleInputChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      disabled={isVerifying}
                      className={cn(
                        "w-10 h-14 sm:w-14 sm:h-20 text-2xl sm:text-4xl font-black text-center uppercase bg-white border-4 border-black",
                        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]",
                        "focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none",
                        digit && "bg-blue-400 text-white",
                        error && "bg-red-500 text-white border-red-900"
                      )}
                    />
                  </motion.div>
                ))}
              </div>

              {isVerifying && (
                <div className="flex items-center gap-2 font-black animate-pulse">
                  <div className="w-4 h-4 bg-black rounded-full animate-bounce" />
                  <span>MEMVERIFIKASI…</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="start-gate"
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              className="w-full flex flex-col items-center"
            >
              <button
                onClick={startExam}
                className={cn(
                  "group relative w-full py-10 bg-green-500 border-4 border-black text-white",
                  "shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                  "hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-none active:translate-x-[8px] active:translate-y-[8px]",
                  "transition-all duration-100 ease-in-out"
                )}
              >
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-5xl font-black uppercase tracking-tighter italic">MULAI UJIAN</span>
                  <span className="text-xl font-bold bg-black px-4 py-1 rounded-sm group-hover:bg-white group-hover:text-black transition-colors">
                    SIAP TEMPUR!
                  </span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative text */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center font-bold text-black/40 uppercase tracking-widest text-xs"
      >
        Dilarang menyontek. Kejujuran adalah koentji.
      </motion.p>
    </div>
  );
}
