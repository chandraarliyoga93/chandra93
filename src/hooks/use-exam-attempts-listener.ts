"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ExamAttempt } from "@/types/exam";

interface UseExamAttemptsResult {
  attempts: ExamAttempt[];
  loading: boolean;
  error: string | null;
}

export function useExamAttemptsListener(examId: string | undefined): UseExamAttemptsResult {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;

    setLoading(true);
    setError(null);

    // Initial fetch
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('ExamAttempt')
        .select(`
          *,
          student:User (
            name
          )
        `)
        .eq('examId', examId);

      if (error) {
        console.error("Error fetching initial exam attempts:", error);
        setError("Gagal memuat data live monitoring");
      } else {
        setAttempts(data.map((a: any) => ({
          ...a,
          studentName: a.student?.name || "Siswa",
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          lastActivityAt: a.lastActivityAt,
        })) as ExamAttempt[]);
      }
      setLoading(false);
    };

    fetchInitial();

    // Subscribe to changes
    const channel = supabase
      .channel(`exam_attempts_${examId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ExamAttempt',
          filter: `examId=eq.${examId}`,
        },
        () => {
          // Re-fetch all or apply differential update
          fetchInitial();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [examId]);

  return { attempts, loading, error };
}

