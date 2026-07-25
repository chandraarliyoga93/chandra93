"use client";

import { useState, useRef } from "react";
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
import { NavArrowLeft, MediaImage } from "iconoir-react";
import Link from "next/link";
import { createCourse } from "@/actions/lms-course-supabase";
import {
	normalizeCoverImageUrl,
	readImageFileAsDataUrl,
} from "@/lib/lms/course-cover";
import { toast } from "sonner";

export default function CreateCoursePage() {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [coverImage, setCoverImage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		const trimmedCover = coverImage.trim();
		const coverPayload = trimmedCover
			? normalizeCoverImageUrl(trimmedCover)
			: null;

		const result = await createCourse({
			title,
			description: description || null,
			coverImage: coverPayload,
			status: "DRAFT",
		});

		setIsSubmitting(false);

		if (!result.success || !result.data) {
			setError(result.error || "Gagal membuat kursus");
			return;
		}

		router.push(`/dashboard/guru/lms/${result.data.id}`);
	};

	return (
		<div className="p-6 max-w-3xl mx-auto space-y-6">
			<div className="flex items-start gap-4">
				<Button asChild variant="outline" size="icon" className="mt-1 shrink-0">
					<Link href="/dashboard/guru/lms">
						<NavArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Buat Kursus Baru
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Siapkan informasi dasar kursus. Modul dan materi bisa ditambahkan
						setelah kursus dibuat.
					</p>
				</div>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle>Informasi Kursus</CardTitle>
					<CardDescription>
						Lengkapi judul, deskripsi, dan gambar sampul agar kursus lebih mudah
						dikenali siswa.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="title">Judul Kursus</Label>
							<Input
								id="title"
								placeholder="Contoh: Matematika Dasar Semester 1"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Deskripsi</Label>
							<Textarea
								id="description"
								placeholder="Deskripsi singkat tentang kursus ini..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
							/>
						</div>

						<div className="space-y-2">
							<Label>Gambar Sampul</Label>
							<div className="flex flex-col gap-3">
								<div className="flex flex-col sm:flex-row gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={() => fileInputRef.current?.click()}
										className="w-fit transition-all hover:-translate-y-0.5"
									>
										<MediaImage className="w-4 h-4 mr-2" />
										Pilih Gambar
									</Button>
									<input
										ref={fileInputRef}
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
														"Gambar sampul siap (disimpan bersama kursus).",
													);
												} catch (err) {
													const msg =
														err instanceof Error
															? err.message
															: "Gagal memproses gambar";
													toast.error(msg);
													if (fileInputRef.current)
														fileInputRef.current.value = "";
												}
											})();
										}}
									/>
								</div>
								<Input
									placeholder="Atau tempel URL gambar langsung (bukan halaman share saja)…"
									value={coverImage}
									onChange={(e) => setCoverImage(e.target.value)}
									onBlur={(ev) => {
										const t = ev.target.value.trim();
										if (!t || t.startsWith("data:")) return;
										const n = normalizeCoverImageUrl(t);
										if (n !== t) {
											setCoverImage(n);
											toast.message(
												"URL disesuaikan agar gambar bisa dimuat (mis. Google Drive).",
											);
										}
									}}
									className="flex-1"
								/>
								<p className="text-xs text-muted-foreground">
									Unggah dari perangkat menyimpan gambar di kursus (format data
									URL). Untuk tautan: pakai URL gambar langsung, atau tautan
									bagikan Google Drive/Dropbox yang sudah di-normalisasi
									otomatis.
								</p>
								{coverImage && (
									<div className="relative w-full aspect-video max-w-xl rounded-lg overflow-hidden border">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={normalizeCoverImageUrl(coverImage)}
											alt="Pratinjau sampul"
											className="h-full w-full object-cover"
											onError={() => setCoverImage("")}
										/>
										<button
											type="button"
											onClick={() => {
												setCoverImage("");
												if (fileInputRef.current)
													fileInputRef.current.value = "";
											}}
											className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full px-2 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
										>
											Hapus
										</button>
									</div>
								)}
							</div>
						</div>

						{error && (
							<div className="p-3 border rounded-lg bg-destructive/10 text-destructive text-sm">
								{error}
							</div>
						)}

						<div className="flex justify-end gap-3">
							<Button asChild variant="outline" type="button">
								<Link href="/dashboard/guru/lms">Batal</Link>
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="min-w-28 transition-all hover:-translate-y-0.5"
							>
								{isSubmitting ? "Membuat..." : "Buat Kursus"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
