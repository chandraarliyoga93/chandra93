"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, Info } from "lucide-react";
import { Plus as PlusIcon, Trash as TrashIcon } from "iconoir-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { QuizData, QuizQuestion } from "./lms-lesson-types";

interface QuizBuilderProps {
  initialData?: QuizData | null;
  onChange: (data: QuizData) => void;
}

export function QuizBuilder({ initialData, onChange }: QuizBuilderProps) {
  const [data, setData] = useState<QuizData>(() => {
    const defaultData: QuizData = {
      passingGrade: 70,
      coolDownMinutes: 0,
      questions: [],
    };

    if (!initialData) return defaultData;

    return {
      passingGrade: typeof initialData.passingGrade === "number" ? initialData.passingGrade : 70,
      coolDownMinutes: typeof initialData.coolDownMinutes === "number" ? initialData.coolDownMinutes : 0,
      questions: Array.isArray(initialData.questions) ? initialData.questions : [],
    };
  });

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Math.random().toString(36).substring(2, 9),
      text: "",
      options: ["", ""],
      answerIndex: 0,
      explanation: "",
    };
    setData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const removeQuestion = (id: string) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    }));
  };

  const addOption = (questionId: string) => {
    const question = data.questions.find((q) => q.id === questionId);
    if (question && question.options.length < 5) {
      updateQuestion(questionId, {
        options: [...question.options, ""],
      });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = data.questions.find((q) => q.id === questionId);
    if (question && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      let newAnswerIndex = question.answerIndex;
      if (question.answerIndex === optionIndex) {
        newAnswerIndex = 0;
      } else if (question.answerIndex > optionIndex) {
        newAnswerIndex--;
      }
      updateQuestion(questionId, {
        options: newOptions,
        answerIndex: newAnswerIndex,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="passing-grade">Nilai Kelulusan (0-100)</Label>
          <Input
            id="passing-grade"
            type="number"
            min={0}
            max={100}
            value={data.passingGrade}
            onChange={(e) =>
              setData((prev) => ({ ...prev, passingGrade: parseInt(e.target.value) || 0 }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cooldown">Waktu Tunggu Retake (menit)</Label>
          <Input
            id="cooldown"
            type="number"
            min={0}
            value={data.coolDownMinutes}
            onChange={(e) =>
              setData((prev) => ({ ...prev, coolDownMinutes: parseInt(e.target.value) || 0 }))
            }
          />
        </div>
      </div>

      <Separator />

      {/* Questions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Daftar Pertanyaan ({data.questions.length})</h3>
          <Button onClick={addQuestion} size="sm" className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Tambah Pertanyaan
          </Button>
        </div>

        {data.questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
            <p className="text-muted-foreground mb-4">Belum ada pertanyaan.</p>
            <Button onClick={addQuestion} variant="outline" size="sm" className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Mulai buat kuis
            </Button>
          </div>
        ) : (
          data.questions.map((q, qIndex) => (
            <Card key={q.id} className="relative overflow-hidden border-2">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-base font-semibold">
                  Pertanyaan #{qIndex + 1}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeQuestion(q.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Teks Pertanyaan</Label>
                  <Textarea
                    placeholder="Masukkan pertanyaan di sini..."
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Pilihan Jawaban</Label>
                    <span className="text-xs text-muted-foreground italic">
                      Pilih tombol bulat untuk menandai jawaban yang benar.
                    </span>
                  </div>
                  
                  <RadioGroup
                    value={q.answerIndex.toString()}
                    onValueChange={(val) => updateQuestion(q.id, { answerIndex: parseInt(val) })}
                    className="space-y-3"
                  >
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <RadioGroupItem value={oIndex.toString()} id={`q-${q.id}-opt-${oIndex}`} />
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder={`Pilihan ${oIndex + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[oIndex] = e.target.value;
                              updateQuestion(q.id, { options: newOpts });
                            }}
                          />
                          {q.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeOption(q.id, oIndex)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  {q.options.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => addOption(q.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Pilihan
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Penjelasan Jawaban</Label>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <Textarea
                    placeholder="Berikan penjelasan mengapa jawaban ini benar..."
                    value={q.explanation}
                    onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
