"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Task, getTasksWithPaginationSupabase } from "@/actions/tasks-supabase";
import { GradeData } from "@/actions/grades-supabase";
import { StudentTaskCard } from "./StudentTaskCard";
import { Infinite, WarningCircle } from "iconoir-react";
import { Button } from "@/components/ui/button";

interface LoadMoreTasksProps {
  classId: string;
  initialLastId: string | undefined;
  grades: GradeData[];
}

export function LoadMoreTasks({ classId, initialLastId, grades }: LoadMoreTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastId, setLastId] = useState<string | undefined>(initialLastId);
  const [hasMore, setHasMore] = useState(!!initialLastId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (inView && hasMore && !loading && !error) {
      loadMore();
    }
  }, [inView, hasMore, loading, error]);

  const loadMore = async () => {
    if (!lastId) return;
    
    setLoading(true);
    setError(false);
    try {
      const newTasks = await getTasksWithPaginationSupabase(classId, 5, lastId);
      
      if (newTasks.length > 0) {
        setTasks((prev) => [...prev, ...newTasks]);
        setLastId(newTasks[newTasks.length - 1].id);
        if (newTasks.length < 5) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more tasks:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 mt-4">
        {tasks.map((task) => {
          const taskGrade = grades.find((g) => g.taskId === task.id);
          return (
            <StudentTaskCard 
              key={task.id} 
              task={task} 
              gradeData={taskGrade || null} 
            />
          );
        })}
      </div>

      {hasMore && (
        <div 
          ref={ref} 
          className="flex justify-center py-8"
        >
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <Infinite className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                Memuat lebih banyak...
              </p>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-destructive font-black uppercase italic">
                <WarningCircle className="h-5 w-5" />
                <p className="text-sm">Gagal memuat data</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadMore}
                className="rounded-none border-4 border-neo-border font-black uppercase tracking-widest text-[10px] bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 text-foreground"
              >
                Coba Lagi
              </Button>
            </div>
          )}
        </div>
      )}

      {!hasMore && tasks.length > 0 && (
        <div className="text-center py-10 opacity-50">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">
            Semua misi udah kelihatan semua
          </p>
        </div>
      )}
    </>
  );
}
