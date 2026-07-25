"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	NavArrowLeft,
	Trash,
	Check,
	Plus,
	X,
	InfoCircle,
	MediaImage,
	StatsReport,
} from "iconoir-react";
import {
	normalizeCoverImageUrl,
	readImageFileAsDataUrl,
} from "@/lib/lms/course-cover";
import Link from "next/link";
import {
	updateCourse,
	deleteCourse,
	getClassesByAdmin,
	assignCourseToClasses,
	unassignCourse,
} from "@/actions/lms-course-supabase";
import type { CourseRewardsValues } from "@/lib/lms/course-rewards";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface Assignment {
	id: string;
	classId: string;
	assignedAt: Date;
	class: {
		id: string;
		name: string;
		code: string;
	};
}

interface CourseSettingsPageProps {
	course: {
		id: string;
		title: string;
		description: string | null;
		coverImage: string | null;
		status: "DRAFT" | "PUBLISHED";
		teacherId: string;
		initialRewards: CourseRewardsValues;
		badges: Array<{ id: string; label: string; emoji: string }>;
	};
	assignments?: Assignment[];
}

const BADGE_NONE = "__none__";

export function CourseSettingsClient({
	course,
	assignments = [],
}: CourseSettingsPageProps) {
	const router = useRouter();
	const [title, setTitle] = useState(course.title);
	const [description, setDescription] = useState(course.description || "");
	const [status, setStatus] = useState(course.status);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const [lessonXp, setLessonXp] = useState(
		String(course.initialRewards.lessonXp),
	);
	const [quizMaxXp, setQuizMaxXp] = useState(
		String(course.initialRewards.quizMaxXp),
	);
	const [completionXp, setCompletionXp] = useState(
		String(course.initialRewards.completionXp),
	);
	const [badgeChoice, setBadgeChoice] = useState(
		course.initialRewards.badgeId ?? BADGE_NONE,
	);
	const [isSavingRewards, setIsSavingRewards] = useState(false);

	const [classes, setClasses] = useState<
		{ id: string; name: string; code: string }[]
	>([]);
	const [pendingClassIds, setPendingClassIds] = useState<string[]>([]);
	const [isLoadingClasses, setIsLoadingClasses] = useState(true);
	const [isAssigning, setIsAssigning] = useState(false);

	const [coverImage, setCoverImage] = useState(course.coverImage || "");
	const coverFileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		getClassesByAdmin().then((result) => {
			if (result.success) {
				setClasses(result.data || []);
			}
			setIsLoadingClasses(false);
		});
	}, []);

	const assignedClassIds = assignments.map((a) => a.classId);
	const availableClasses = classes.filter(
		(c) => !assignedClassIds.includes(c.id),
	);

	const parseNonNegInt = (raw: string, fallback = 0) => {
		const n = Math.floor(Number(raw));
		if (!Number.isFinite(n) || n < 0) return fallback;
		return Math.min(n, 1_000_000);
	};

	const handleSave = async () => {
		setIsSubmitting(true);
		const trimmed = coverImage.trim();
		const coverPayload = trimmed ? normalizeCoverImageUrl(trimmed) : null;
		const result = await updateCourse(course.id, {
			title,
			description: description || null,
			status,
			coverImage: coverPayload,
		});
		setIsSubmitting(false);
		if (result.success) {
			toast.success("Pengaturan berhasil disimpan");
			router.refresh();
		} else {
			toast.error(result.error || "Gagal menyimpan pengaturan");
		}
	};

	const handleSaveRewards = async () => {
		setIsSavingRewards(true);
		const result = await updateCourse(course.id, {
			rewards: {
				lessonXp: parseNonNegInt(lessonXp, 0),
				quizMaxXp: parseNonNegInt(quizMaxXp, 0),
				completionXp: parseNonNegInt(completionXp, 0),
				badgeId:
					badgeChoice === BADGE_NONE || badgeChoice.length === 0
						? null
						: badgeChoice,
			},
		});
		setIsSavingRewards(false);
		if (result.success) {
			toast.success("Hadiah & XP disimpan");
			router.refresh();
		} else {
			toast.error(result.error || "Gagal menyimpan hadiah");
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		const result = await deleteCourse(course.id);
		setIsDeleting(false);
		if (result.success) {
			toast.success("Kursus berhasil dihapus");
			router.push("/dashboard/guru/lms");
		} else {
			toast.error(result.error || "Gagal menghapus kursus");
		}
	};

	const togglePendingClass = (classId: string) => {
		setPendingClassIds((prev) =>
			prev.includes(classId)
				? prev.filter((id) => id !== classId)
				: [...prev, classId],
		);
	};

	const handleAssignSelected = async () => {
		if (pendingClassIds.length === 0) return;
		const count = pendingClassIds.length;
		setIsAssigning(true);
		const result = await assignCourseToClasses(course.id, pendingClassIds);
		setIsAssigning(false);
		if (result.success) {
			setPendingClassIds([]);
			toast.success(
				count > 1
					? `Kursus ditetapkan ke ${count} kelas`
					: "Kursus berhasil ditetapkan",
			);
			router.refresh();
		} else {
			toast.error(result.error || "Gagal menetapkan kursus");
		}
	};

	const handleUnassign = async (classId: string) => {
		const result = await unassignCourse(course.id, classId);
		if (result.success) {
			toast.success("Penetapan kursus dihapus");
			router.refresh();
		} else {
			toast.error(result.error || "Gagal menghapus penetapan");
		}
	};

	return (
		<div className="p-6 max-w-2xl mx-auto">
			<div className="mb-6 flex flex-wrap items-center gap-3">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<Button asChild variant="ghost" size="icon" className="shrink-0">
						<Link
							href={`/dashboard/guru/lms/${course.id}`}
							aria-label="Kembali ke editor kursus"
						>
							<NavArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<h1 className="min-w-0 text-2xl font-semibold">Pengaturan Kursus</h1>
				</div>
				<Button asChild variant="outline" size="sm" className="shrink-0">
					<Link href={`/dashboard/guru/lms/${course.id}/analytics`}>
						<StatsReport className="mr-2 h-4 w-4" />
						Analitik
					</Link>
				</Button>
			</div>

			<div className="space-y-6">
				{/* Informasi Dasar */}
				<Card>
					<CardHeader>
						<CardTitle>Informasi Dasar</CardTitle>
						<CardDescription>Ubah informasi utama kursus Anda.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="title">Judul Kursus</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Deskripsi</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
							/>
						</div>
						<div className="space-y-2">
							<Label>Gambar sampul</Label>
							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
									<Button
										type="button"
										variant="outline"
										onClick={() => coverFileInputRef.current?.click()}
										className="w-fit"
									>
										<MediaImage className="mr-2 h-4 w-4" />
										Pilih gambar
									</Button>
									<input
										ref={coverFileInputRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (!file) return;
											void (async () => {
												try {
													const dataUrl = await readImageFileAsDataUrl(file);
													setCoverImage(dataUrl);
													toast.success(
														"Pratinjau sampul diperbarui. Simpan untuk menerapkan.",
													);
												} catch (err) {
													const msg =
														err instanceof Error
															? err.message
															: "Gagal memproses gambar";
													toast.error(msg);
													if (coverFileInputRef.current)
														coverFileInputRef.current.value = "";
												}
											})();
										}}
									/>
								</div>
								<Input
									placeholder="Atau URL gambar / tautan Drive yang bisa diakses"
									value={coverImage}
									onChange={(e) => setCoverImage(e.target.value)}
									onBlur={(ev) => {
										const t = ev.target.value.trim();
										if (!t || t.startsWith("data:")) return;
										const n = normalizeCoverImageUrl(t);
										if (n !== t) {
											setCoverImage(n);
											toast.message("URL disesuaikan agar gambar bisa dimuat.");
										}
									}}
								/>
								<p className="text-xs text-muted-foreground">
									Unggah menyimpan gambar di kursus. Tautan Google Drive (akses
									publik) otomatis diubah ke URL tampilan gambar bila
									memungkinkan.
								</p>
								{coverImage ? (
									<div className="relative aspect-video max-w-xl overflow-hidden rounded-lg border">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={normalizeCoverImageUrl(coverImage)}
											alt="Pratinjau sampul"
											className="h-full w-full object-cover"
											onError={() => setCoverImage("")}
										/>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											className="absolute right-2 top-2"
											onClick={() => {
												setCoverImage("");
												if (coverFileInputRef.current)
													coverFileInputRef.current.value = "";
											}}
										>
											Hapus
										</Button>
									</div>
								) : null}
							</div>
						</div>
						<div className="space-y-2">
							<Label>Status</Label>
							<div className="flex gap-2">
								<Button
									variant={status === "DRAFT" ? "default" : "outline"}
									size="sm"
									onClick={() => setStatus("DRAFT")}
								>
									Draft
								</Button>
								<Button
									variant={status === "PUBLISHED" ? "default" : "outline"}
									size="sm"
									onClick={() => setStatus("PUBLISHED")}
								>
									Publikasi
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								{status === "DRAFT"
									? "Kursus hanya bisa dilihat oleh Anda."
									: "Kursus dapat diakses oleh siswa."}
							</p>
						</div>
						<Button onClick={handleSave} disabled={isSubmitting}>
							{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
						</Button>
					</CardContent>
				</Card>

				{/* Hadiah & XP */}
				<Card>
					<CardHeader>
						<CardTitle>Hadiah & XP</CardTitle>
						<CardDescription>
							Atur XP yang siswa dapat dari materi teks, kuis mini, dan bonus
							saat menyelesaikan seluruh kursus (klaim hadiah).
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-3">
							<div className="space-y-2">
								<Label htmlFor="lessonXp">XP materi teks (per materi)</Label>
								<Input
									id="lessonXp"
									inputMode="numeric"
									type="number"
									min={0}
									value={lessonXp}
									onChange={(e) => setLessonXp(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Dipakai saat siswa menekan selesai pada materi bertipe teks.
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="quizMaxXp">XP kuis maksimum</Label>
								<Input
									id="quizMaxXp"
									inputMode="numeric"
									type="number"
									min={0}
									value={quizMaxXp}
									onChange={(e) => setQuizMaxXp(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Skor kuis mengatur XP secara proporsional (mis. 80% skor ≈ 80%
									dari nilai ini).
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="completionXp">Bonus selesai kursus</Label>
								<Input
									id="completionXp"
									inputMode="numeric"
									type="number"
									min={0}
									value={completionXp}
									onChange={(e) => setCompletionXp(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Diberikan saat siswa mengklaim hadiah setelah semua materi
									selesai.
								</p>
							</div>
						</div>
						<div className="space-y-2 max-w-md">
							<Label>Badge (opsional)</Label>
							<Select value={badgeChoice} onValueChange={setBadgeChoice}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Pilih badge" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={BADGE_NONE}>Tanpa badge</SelectItem>
									{course.badges.map((b) => (
										<SelectItem key={b.id} value={b.id}>
											<span className="flex items-center gap-2">
												<span aria-hidden>{b.emoji}</span>
												<span>{b.label}</span>
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Badge dikirim bersama bonus selesai kursus jika diklaim oleh
								siswa.
							</p>
						</div>
						<Button
							type="button"
							onClick={handleSaveRewards}
							disabled={isSavingRewards}
						>
							{isSavingRewards ? "Menyimpan..." : "Simpan hadiah & XP"}
						</Button>
					</CardContent>
				</Card>

				{/* Penetapan ke Kelas */}
				<Card>
					<CardHeader>
						<CardTitle>Penempatan dan assign ke kelas</CardTitle>
						<CardDescription>
							Satu kursus bisa di-assign ke{" "}
							<strong>banyak kelas sekaligus</strong>. Kelas yang dipilih di
							sini adalah milik Anda (admin kelas).
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert>
							<InfoCircle className="h-4 w-4" />
							<AlertTitle>Yang dilihat siswa</AlertTitle>
							<AlertDescription className="text-sm space-y-1.5">
								<p>
									Siswa hanya melihat kursus jika status{" "}
									<strong>Publikasi</strong> dan kelasnya ada di daftar di
									bawah. Mereka membuka{" "}
									<strong>
										Dashboard → pilih circle → Tugas → tab &quot;Materi&quot;
									</strong>
									, atau lewat menu <strong>LMS</strong> untuk gabungan semua
									circle.
								</p>
							</AlertDescription>
						</Alert>
						{/* Assigned Classes */}
						{assignments.length > 0 && (
							<div className="space-y-2">
								<Label>Kelas yang Ditetapkan</Label>
								<div className="space-y-2">
									{assignments.map((assignment) => (
										<div
											key={assignment.id}
											className="flex items-center justify-between p-3 rounded-md bg-muted/50 border"
										>
											<div className="flex items-center gap-2">
												<Check className="w-4 h-4 text-green-500" />
												<div>
													<p className="text-sm font-medium">
														{assignment.class.name}
													</p>
													<p className="text-xs text-muted-foreground">
														Kode: {assignment.class.code}
													</p>
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-destructive"
												onClick={() => handleUnassign(assignment.classId)}
											>
												<X className="w-4 h-4" />
											</Button>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Assign kelas (multi-pilih) */}
						{!isLoadingClasses && availableClasses.length > 0 && (
							<div className="space-y-3">
								<Label>Tambahkan kelas (bisa pilih banyak)</Label>
								<div className="max-h-48 overflow-y-auto rounded-md border border-input divide-y">
									{availableClasses.map((cls) => (
										<label
											key={cls.id}
											className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
										>
											<Checkbox
												checked={pendingClassIds.includes(cls.id)}
												onCheckedChange={() => togglePendingClass(cls.id)}
											/>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium truncate">
													{cls.name}
												</p>
												<p className="text-xs text-muted-foreground">
													Kode: {cls.code}
												</p>
											</div>
										</label>
									))}
								</div>
								<Button
									type="button"
									onClick={handleAssignSelected}
									disabled={pendingClassIds.length === 0 || isAssigning}
									className="w-full sm:w-auto"
								>
									<Plus className="w-4 h-4 mr-2" />
									{isAssigning
										? "Menyimpan…"
										: pendingClassIds.length > 0
											? `Tetapkan ke ${pendingClassIds.length} kelas`
											: "Tetapkan kelas terpilih"}
								</Button>
							</div>
						)}

						{isLoadingClasses ? (
							<p className="text-sm text-muted-foreground">Memuat kelas...</p>
						) : classes.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Tidak ada kelas yang tersedia.
							</p>
						) : assignments.length === classes.length ? (
							<p className="text-sm text-muted-foreground">
								Semua kelas sudah ditetapkan.
							</p>
						) : null}
					</CardContent>
				</Card>

				{/* Hapus Kursus */}
				<Card className="border-destructive">
					<CardHeader>
						<CardTitle className="text-destructive">Hapus Kursus</CardTitle>
						<CardDescription>
							Tindakan ini permanen dan tidak bisa dibatalkan.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!showDeleteConfirm ? (
							<Button
								variant="destructive"
								onClick={() => setShowDeleteConfirm(true)}
							>
								<Trash className="w-4 h-4 mr-2" />
								Hapus Kursus
							</Button>
						) : (
							<div className="space-y-4">
								<p className="text-sm text-destructive font-medium">
									Apakah Anda yakin ingin menghapus kursus ini? Semua modul dan
									materi akan hilang.
								</p>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() => setShowDeleteConfirm(false)}
									>
										Batal
									</Button>
									<Button
										variant="destructive"
										onClick={handleDelete}
										disabled={isDeleting}
									>
										{isDeleting ? "Menghapus..." : "Ya, Hapus"}
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
