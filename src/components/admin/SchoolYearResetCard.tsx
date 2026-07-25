"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WarningTriangle } from "iconoir-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RESET_SCHOOL_YEAR_CONFIRM_PHRASE } from "@/lib/reset-school-year";
import { resetSchoolYearSupabase } from "@/actions/reset-year-supabase";

export default function SchoolYearResetCard() {
	const [phrase, setPhrase] = useState("");
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState(false);

	const phraseOk = phrase.trim() === RESET_SCHOOL_YEAR_CONFIRM_PHRASE;

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) setPhrase("");
	};

	const handleConfirm = async () => {
		if (!phraseOk) return;
		setPending(true);
		try {
			const result = await resetSchoolYearSupabase(phrase);
			if (!result.success) {
				toast.error("Reset gagal", { description: result.error });
				return;
			}

			const { stats } = result;
			toast.success("Reset tahun ajaran selesai", {
				description: `${stats.classesDeleted} kelas, ${stats.examsDeleted} ujian, ${stats.coursesDeleted} course, ${stats.studentsDeleted} siswa (DB). Auth terhapus: ${stats.authDeleted}.`,
			});

			if (stats.authFailed.length > 0) {
				toast.warning("Beberapa akun Supabase gagal dihapus", {
					description: `${stats.authFailed.length} UID — cek log server atau hapus manual di dashboard Supabase.`,
				});
			}

			setPhrase("");
			setOpen(false);
		} finally {
			setPending(false);
		}
	};

	return (
		<Card className="rounded-3xl border-destructive/30 shadow-xl overflow-hidden">
			<CardHeader className="space-y-2">
				<CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
					<WarningTriangle className="w-5 h-5 text-destructive" aria-hidden />
					Reset tahun ajaran
				</CardTitle>
				<CardDescription className="text-sm leading-relaxed">
					Menghapus kelas, ujian/CBT, LMS, dan siswa yang tidak lagi terdaftar
					di kelas manapun (setelah kelas Anda dihapus).{" "}
					<span className="font-semibold text-foreground">
						Bank soal tidak ikut terhapus.
					</span>{" "}
					Siswa yang masih punya kelas di guru lain tetap aman. Tindakan tidak
					dapat dibatalkan.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<AlertDialog open={open} onOpenChange={handleOpenChange}>
					<AlertDialogTrigger asChild>
						<Button
							type="button"
							variant="destructive"
							className="font-black uppercase tracking-tight"
							disabled={pending}
						>
							Buka konfirmasi penghapusan…
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent className="rounded-3xl max-w-lg">
						<AlertDialogHeader>
							<AlertDialogTitle className="font-black uppercase tracking-tight">
								Konfirmasi reset tahun ajaran
							</AlertDialogTitle>
							<AlertDialogDescription asChild>
								<div className="space-y-3 text-left text-sm leading-relaxed">
									<p>
										Data kelas, ujian, dan LMS untuk akun ini akan{" "}
										<span className="font-semibold text-foreground">
											dihapus permanen
										</span>
										. Master bank soal (
										<span className="font-semibold text-foreground">
											soal tanpa ujian
										</span>
										) tetap ada. Akun siswa yang tidak lagi terdaftar akan
										dihapus dari Supabase Auth jika memungkinkan.
									</p>
									<div className="space-y-2">
										<Label
											htmlFor="reset-phrase-dialog"
											className="text-xs font-black uppercase tracking-widest"
										>
											Ketik frasa untuk melanjutkan
										</Label>
										<Input
											id="reset-phrase-dialog"
											value={phrase}
											onChange={(e) => setPhrase(e.target.value)}
											placeholder={RESET_SCHOOL_YEAR_CONFIRM_PHRASE}
											className="font-mono"
											autoComplete="off"
											disabled={pending}
										/>
										<p className="text-[11px] text-muted-foreground">
											Ketik persis:{" "}
											<code className="font-mono">
												{RESET_SCHOOL_YEAR_CONFIRM_PHRASE}
											</code>
										</p>
									</div>
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
							<Button
								type="button"
								variant="destructive"
								disabled={pending || !phraseOk}
								onClick={handleConfirm}
								className="font-black uppercase"
							>
								{pending ? "Memproses…" : "Ya, hapus data operasional"}
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
				<p className="mt-3 text-[11px] text-muted-foreground">
					Ini membuka popup (modal) di atas halaman. Untuk membatalkan, gunakan
					tombol Batal.
				</p>
			</CardContent>
		</Card>
	);
}
