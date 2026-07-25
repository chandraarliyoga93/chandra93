import { Task } from "@/actions/tasks-supabase";
import { GradeData } from "@/actions/grades-supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InfoCircle, MessageText, BoxingGlove, CheckCircle, Clock } from "iconoir-react";
import { cn } from "@/lib/utils";

export function StudentTaskCard({ 
  task, 
  gradeData 
}: { 
  task: Task; 
  gradeData: GradeData | null 
}) {
  const isCompleted = !!gradeData;

  // Grade color logic
  const getGradeColor = (grade: number) => {
    if (grade >= 80) return "text-green-600 dark:text-green-400 bg-green-500/20";
    if (grade >= 60) return "text-amber-600 dark:text-amber-400 bg-amber-500/20";
    return "text-red-600 dark:text-red-400 bg-red-500/20";
  };

  return (
    <div className="neo-card flex flex-col relative overflow-hidden bg-neo-bg transition-all duration-200 hover:-translate-y-1">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left Side: Quest InfoCircle */}
        <div className="flex-1 p-3 flex flex-col justify-center relative z-10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="flex items-center gap-1 bg-neo-border text-neo-bg text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider italic">
              <BoxingGlove className="w-2.5 h-2.5" />
              Quest
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider italic">
                <CheckCircle className="w-2.5 h-2.5" />
                Selesai
              </span>
            )}
          </div>
          
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-foreground mb-1 leading-none italic">
            {task.title}
          </h3>
          
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <InfoCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p className="text-[11px] font-bold line-clamp-1 leading-snug uppercase">
              {task.description}
            </p>
          </div>
        </div>

        {/* Right Side: Status & Rewards */}
        <div className={`w-full md:w-32 p-3 border-t-4 md:border-t-0 md:border-l-4 border-neo-border flex flex-col items-center justify-center gap-2 ${
          isCompleted ? 'bg-green-500/20 dark:bg-green-950' : 'bg-yellow-500/20 dark:bg-yellow-950'
        }`}>
          {isCompleted ? (
            <>
              <div className={`w-12 h-12 flex items-center justify-center rounded-full border-4 border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)] bg-neo-bg ${getGradeColor(gradeData.grade)}`}>
                <span className="text-xl font-black tabular-nums tracking-tighter">
                  {gradeData.grade}
                </span>
              </div>
              <Badge className="h-6 px-2 text-[9px] bg-green-500 text-black dark:text-white border-2 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] font-black uppercase tracking-wider hover:bg-green-500 italic">
                Selesai
              </Badge>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-neo-bg border-4 border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)] rotate-3 flex items-center justify-center rounded-none">
                <Clock className="w-6 h-6 text-foreground" />
              </div>
              <Badge className="h-6 px-2 text-[9px] bg-yellow-400 text-black border-2 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] font-black uppercase tracking-wider hover:bg-yellow-400 whitespace-nowrap italic">
                Proses
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Feedback Section - Chat Bubble Style */}
      {isCompleted && gradeData.feedback && (
        <div className="p-3 pt-0">
          <div className="relative bg-neo-bg border-4 border-neo-border p-2.5 shadow-[4px_4px_0px_0px_var(--neo-border)] mt-1">
            {/* Chat Bubble Tail */}
            <div className="absolute -top-2 left-6 w-4 h-4 bg-neo-bg border-l-4 border-t-4 border-neo-border transform rotate-45 z-10"></div>
            {/* Hiding bottom border of tail to make it seamless */}
            <div className="absolute -top-1 left-6 w-4 h-3 bg-neo-bg z-20"></div>
            
            <div className="relative z-30">
              <h4 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-0.5 italic">
                <MessageText className="w-2.5 h-2.5" />
                Bisikan Guru
              </h4>
              <p className="text-[11px] font-black italic text-foreground leading-tight uppercase">
                "{gradeData.feedback}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
