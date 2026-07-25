export type ExamType = "exam" | "quiz";

export interface ExamRewards {
	xp: number;
	coin: number;
}

export interface AntiCheatSettings {
	enabled: boolean;
	maxViolations: number;
	forceFullscreen: boolean;
	preventCopyPaste: boolean;
	preventScreenshot: boolean;
	preventSplitScreen: boolean;
	preventScreenRecord: boolean;
}

export type QuestionType =
	| "pg"
	| "pg_kompleks"
	| "bs"
	| "menjodohkan"
	| "mengurutkan"
	| "essay"
	| "matrix"
	| "short_answer";

export interface QuestionOption {
	id: string;
	text: string;
	imageUrl?: string | null;
}

export interface MatchingPair {
	id: string;
	left: string;
	right: string;
}

export interface MatrixRow {
	id: string;
	text: string;
}

export interface MatrixColumn {
	id: string;
	text: string;
}

export interface Passage {
	id: string;
	guruId: string;
	title: string;
	content: string;
	imageUrl?: string | null;
	createdAt: string; // ISO string
	updatedAt: string; // ISO string
}

export interface ExamQuestion {
	id: string;
	text: string;
	type: QuestionType;
	/** Source bank topic id for cloned questions */
	bankId?: string;
	/** Compatibility alias used in UI question picker */
	bankQuestionId?: string;
	options?: QuestionOption[]; // For PG and PG Kompleks
	pairs?: MatchingPair[]; // For Menjodohkan
	rows?: MatrixRow[]; // For Matrix
	columns?: MatrixColumn[]; // For Matrix
	/**
	 * Snapshot of the correct answer for auto-grading.
	 * For newer short_answer/essay questions, structured configs below
	 * should be preferred over relying solely on this field.
	 */
	answer: any;
	/**
	 * Bobot soal dalam satu ujian. Digunakan untuk menghitung skor akhir relatif
	 * terhadap total bobot semua soal.
	 */
	maxPoints?: number;
	/**
	 * Konfigurasi penilaian untuk soal isian singkat.
	 * acceptableAnswers berisi daftar jawaban yang dianggap benar (case-insensitive).
	 */
	shortAnswerConfig?: {
		acceptableAnswers: string[];
	};
	/**
	 * Konfigurasi penilaian untuk soal essay/uraian berbasis kata kunci.
	 */
	essayConfig?: {
		maxPoints: number;
		keywords: {
			text: string;
			weight: number;
			type: "required" | "bonus";
		}[];
	};
	imageUrl?: string | null;
	explanation?: string;
	passageId?: string | null;
}

/**
 * Represents an Exam configuration in Firestore.
 */
export interface Exam {
	id?: string; // Document ID (optional as it might be added after fetch)
	title: string;
	type: ExamType;
	guruId: string;
	classId?: string; // Deprecated: Now managed via ExamAssignment
	duration: number; // minutes
	token?: string;
	isSubmitLocked: boolean;
	questions: ExamQuestion[];
	rewards: ExamRewards;
	assignments?: ExamAssignment[];
	settings: {
		requireToken: boolean;
		shuffleQuestions: boolean;
		shuffleOptions: boolean;
		showScoreImmediately: boolean;
		antiCheat: AntiCheatSettings;
	};
	passages?: Record<string, Passage>;
	status: "draft" | "published" | "archived" | "closed";
	createdAt: any; // Use any to support Firestore Timestamp and JS Date/String
	updatedAt?: any;
}

export interface ExamAssignment {
	id: string;
	examId: string;
	classId: string;
	startTime: string | Date;
	endTime: string | Date;
	status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
	createdAt: string | Date;
	updatedAt: string | Date;
	exam?: Exam;
	class?: { name: string };
}

/**
 * Represents a student's attempt at an exam.
 */
export interface ExamAttempt {
	id?: string;
	examId: string;
	classId?: string; // Target class
	studentId: string;
	studentName?: string;
	answers: Record<string, any>;
	/**
	 * Skor per soal (dalam skala poin soal, 0–maxPoints), termasuk override manual guru.
	 * Key = questionId.
	 */
	perQuestionScores?: Record<string, number>;
	score: number;
	/**
	 * Ringkasan jumlah soal yang terjawab (untuk live monitoring).
	 */
	answeredCount?: number;
	/**
	 * Total jumlah soal di ujian.
	 */
	totalQuestions?: number;
	violations: number;
	startedAt: string | any;
	submittedAt: string | any;
	timeTaken: number; // in minutes
	isSubmitEnabled: boolean;
	/**
	 * Timestamp aktivitas terakhir siswa dalam ujian (heartbeat).
	 */
	lastActivityAt?: string | any;
	/**
	 * Berapa kali attempt ini di-reset oleh guru.
	 */
	resetCount?: number;
	/**
	 * Log pelanggaran anti-cheat.
	 */
	violationLogs?: {
		type: string;
		at: string | any;
		detail: string;
	}[];
	status: "in_progress" | "completed" | "auto_submitted" | "locked";
}
