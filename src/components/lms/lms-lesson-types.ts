export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizData {
  passingGrade: number;
  coolDownMinutes: number;
  questions: QuizQuestion[];
}

/** Shape materi yang dipakai editor kursus (Guru LMS). */
export interface LmsLesson {
  id: string;
  title: string;
  content: string | null;
  type: "TEXT" | "QUIZ";
  quizData?: QuizData | null;
  attachments?: Array<{ name?: string }>;
  order?: number;
  moduleId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
