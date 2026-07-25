"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Heading } from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import YoutubeEmbed from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";
import { NavArrowLeft, FloppyDisk, Trash } from "iconoir-react";
import {
	Bold,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link2,
	List,
	ListOrdered,
	Redo2,
	Image as ImageToolbarIcon,
	Underline as UnderlineIcon,
	Undo2,
	Video,
	Youtube as YoutubeIcon,
} from "lucide-react";

import type { LmsLesson, QuizData } from "@/components/lms/lms-lesson-types";
import {
	DriveEmbed,
	drivePreviewSrcFromUrl,
} from "@/components/lms/tiptap/DriveEmbed";
import { normalizeMarkdownPasteHtml } from "@/components/lms/tiptap/normalizeMarkdownPasteHtml";
import Image from "@tiptap/extension-image";
import { markdownItTable } from "markdown-it-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { deleteLesson, updateLesson } from "@/actions/lms-course-supabase";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizBuilder } from "@/components/lms/QuizBuilder";

type LessonFullPageEditorProps = {
	courseId: string;
	courseTitle: string;
	lesson: LmsLesson;
};

function looksLikeMarkdown(text: string): boolean {
	const t = text.trim();
	if (t.length < 2) return false;

	const linePatterns = [
		/^(?:#{1,6})\s+\S/m,
		/^(?:[-*+])\s+\S/m,
		/^(?:\d+)\.\s+\S/m,
		/^(?:>)\s?/m,
		/^(?:[-*_]){3,}\s*$/m,
		/^(?:```|~~~)/m,
		/^(?:- \[[ xX]\] )/m,
		/^(?:\|).+\|/m,
	];
	if (linePatterns.some((rx) => rx.test(t))) return true;

	const inlinePatterns = [
		/\*\*[^*]+\*\*/,
		/__[^_]+__/,
		/\[[^\]]+\]\([^)\s]+\)/,
		/!\[[^\]]*\]\([^)\s]+\)/,
		/`[^`\n]+`/,
		/~~[^~\n]+~~/,
	];
	if (inlinePatterns.some((rx) => rx.test(t))) return true;

	const lines = t.split(/\r?\n/).filter(Boolean);
	if (lines.length >= 3) {
		const mdish = lines.filter((l) =>
			/^(#{1,6}\s|[-*+]\s|\d+\.\s|> |- \[[ xX]\] )/.test(l),
		).length;
		if (mdish >= 2) return true;
	}

	return false;
}

export function LessonFullPageEditor({
	courseId,
	courseTitle,
	lesson,
}: LessonFullPageEditorProps) {
	const router = useRouter();
	const [title, setTitle] = useState(lesson.title);
	const [lessonType, setLessonType] = useState<"TEXT" | "QUIZ">(
		lesson.type || "TEXT",
	);
	const [quizData, setQuizData] = useState<QuizData | null>(
		lesson.quizData || null,
	);
	const [isSaving, setIsSaving] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [linkDraft, setLinkDraft] = useState("https://");

	const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
	const [youtubeDraft, setYoutubeDraft] = useState(
		"https://www.youtube.com/watch?v=",
	);
	const [driveDialogOpen, setDriveDialogOpen] = useState(false);
	const [driveDraft, setDriveDraft] = useState(
		"https://drive.google.com/file/d/FILE_ID/view?usp=share_link",
	);
	const [imageDialogOpen, setImageDialogOpen] = useState(false);
	const [imageDraft, setImageDraft] = useState("https://");
	const markdown = useMemo(() => {
		const md = new MarkdownIt({
			html: false,
			linkify: true,
			breaks: true,
			typographer: true,
		});
		md.use(markdownItTaskLists, {
			enabled: true,
			label: true,
			labelAfter: true,
		});
		md.use(markdownItTable);
		return md;
	}, []);

	const editor = useEditor(
		{
			immediatelyRender: false,
			extensions: [
				StarterKit.configure({
					// Hindari duplikasi node/mark: duplikat merusak toggleHeading, bold, dll.
					heading: false,
					underline: false,
					link: false,
				}),
				Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
				Underline,
				LinkExtension.configure({
					openOnClick: false,
					autolink: true,
					linkOnPaste: true,
					HTMLAttributes: {
						class: "text-primary underline underline-offset-2",
						rel: "noopener noreferrer",
						target: "_blank",
					},
				}),
				Placeholder.configure({
					placeholder:
						"Tulis materi… Tempel markdown dari Catatan/VS Code akan otomatis dikonversi (judul #, tabel, checklist). Toolbar: judul H1–H3, daftar, tautan, YouTube, gambar (URL).",
				}),
				YoutubeEmbed.configure({
					controls: true,
					nocookie: true,
					width: 640,
					height: 360,
					HTMLAttributes: {
						class: "rounded-md overflow-hidden border shadow-sm my-4",
					},
				}),
				DriveEmbed,
				Image.configure({
					inline: false,
					allowBase64: false,
					HTMLAttributes: {
						class: "my-4 max-w-full h-auto rounded-md border border-border",
					},
				}),
				TaskList,
				TaskItem.configure({ nested: true }),
				Table.configure({ resizable: true }),
				TableRow,
				TableHeader,
				TableCell,
			],
			content: lesson.content || "",
			editorProps: {
				attributes: {
					class: cn(
						"prose prose-sm md:prose-base dark:prose-invert max-w-none",
						"min-h-[60vh] w-full px-4 py-4 focus:outline-none",
						// NOTE: className ini ditempel langsung ke elemen `.ProseMirror`, jadi selector pakai `[&_tag]`.
						"[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold",
						"[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold",
						"[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-semibold",
						"[&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3",
						"[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5",
						"[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse",
						"[&_th]:border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left",
						"[&_td]:border [&_td]:p-2",
						"[&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:max-w-full",
						"[&_img]:mx-auto [&_img]:my-4 [&_img]:block",
						"[&_hr]:my-8 [&_hr]:border-neo-border",
						"[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic",
					),
				},
			},
		},
		[lesson.id],
	);

	useEffect(() => {
		if (!editor) return;

		const onPaste = (event: ClipboardEvent) => {
			const clipboard = event.clipboardData;
			if (!clipboard) return;

			const plain = clipboard.getData("text/plain");
			if (!plain?.trim() || !looksLikeMarkdown(plain)) return;

			event.preventDefault();
			try {
				const renderedHtml = markdown.render(plain);
				const normalized = normalizeMarkdownPasteHtml(renderedHtml);
				editor.chain().focus().insertContent(normalized).run();
				toast.success("Markdown terdeteksi: format otomatis dikonversi.");
			} catch (e) {
				console.error(e);
				toast.error("Gagal menempel markdown. Coba tempel sebagai teks biasa.");
			}
		};

		const dom = editor.view.dom;
		dom.addEventListener("paste", onPaste);
		return () => dom.removeEventListener("paste", onPaste);
	}, [editor, markdown]);

	const handleSave = async () => {
		if (!editor) return;
		setIsSaving(true);
		const html = editor.getHTML();
		const result = await updateLesson(lesson.id, {
			title: title.trim(),
			content: html,
			type: lessonType,
			quizData: lessonType === "QUIZ" ? quizData : null,
		});
		setIsSaving(false);
		if (result.success) {
			toast.success("Materi disimpan");
			router.refresh();
		} else {
			toast.error(result.error || "Gagal menyimpan");
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		const result = await deleteLesson(lesson.id);
		setIsDeleting(false);
		setConfirmDeleteOpen(false);
		if (result.success) {
			toast.success("Materi dihapus");
			router.push(`/dashboard/guru/lms/${courseId}`);
			router.refresh();
			return;
		}
		toast.error(result.error || "Gagal menghapus");
	};

	const openLinkDialog = () => {
		if (!editor) return;
		const prev = editor.getAttributes("link").href as string | undefined;
		setLinkDraft(prev?.trim() ? String(prev) : "https://");
		setLinkDialogOpen(true);
	};

	const applyLink = () => {
		if (!editor) return;
		const href = linkDraft.trim();
		if (!href) {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			setLinkDialogOpen(false);
			return;
		}
		let normalized = href;
		if (!/^https?:\/\//i.test(href)) {
			normalized = `https://${href}`;
		}
		// Jika selection kosong, buat teks URL terlebih dulu agar mark link tetap tersimpan.
		const { empty } = editor.state.selection;

		if (empty) {
			editor
				.chain()
				.focus()
				.setLink({ href: normalized })
				.insertContent(normalized)
				.run();
		} else {
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: normalized })
				.run();
		}
		setLinkDialogOpen(false);
	};

	const openYoutubeDialog = () => {
		setYoutubeDraft("https://www.youtube.com/watch?v=");
		setYoutubeDialogOpen(true);
	};

	const openDriveDialog = () => {
		setDriveDraft(
			"https://drive.google.com/file/d/FILE_ID/view?usp=share_link",
		);
		setDriveDialogOpen(true);
	};

	const applyYoutube = () => {
		if (!editor) return;
		const raw = youtubeDraft.trim();
		if (!raw) {
			setYoutubeDialogOpen(false);
			return;
		}
		if (!/youtube\.com|youtu\.be/i.test(raw)) {
			toast.error("Tempel URL YouTube yang valid (youtube.com atau youtu.be)");
			return;
		}
		editor.chain().focus().setYoutubeVideo({ src: raw }).run();
		setYoutubeDialogOpen(false);
	};

	const applyDrive = () => {
		if (!editor) return;
		const raw = driveDraft.trim();
		if (!raw) {
			setDriveDialogOpen(false);
			return;
		}
		const src = drivePreviewSrcFromUrl(raw);
		if (!src) {
			toast.error(
				"Link Drive tidak valid. Pastikan formatnya seperti /file/d/FILE_ID/…",
			);
			return;
		}
		editor
			.chain()
			.focus()
			.insertContent({ type: "driveEmbed", attrs: { src } })
			.run();
		setDriveDialogOpen(false);
	};

	const openImageDialog = () => {
		setImageDraft("https://");
		setImageDialogOpen(true);
	};

	const applyImage = () => {
		if (!editor) return;
		const raw = imageDraft.trim();
		if (!raw) {
			setImageDialogOpen(false);
			return;
		}
		let src = raw;
		if (!/^https?:\/\//i.test(src)) {
			src = `https://${src}`;
		}
		try {
			const u = new URL(src);
			if (u.protocol !== "http:" && u.protocol !== "https:") {
				toast.error("Gunakan URL yang dimulai dengan http atau https.");
				return;
			}
		} catch {
			toast.error("URL gambar tidak valid.");
			return;
		}
		editor.chain().focus().setImage({ src }).run();
		setImageDialogOpen(false);
	};

	return (
		<div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col -m-6">
			<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
				<Button
					asChild
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0"
				>
					<Link
						href={`/dashboard/guru/lms/${courseId}`}
						aria-label="Kembali ke kurikulum"
					>
						<NavArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<Separator orientation="vertical" className="h-6" />
				<div className="min-w-0 flex-1">
					<p className="truncate text-xs text-muted-foreground">
						{courseTitle}
					</p>
					<p className="truncate text-sm font-medium">Edit materi</p>
				</div>
				<Button
					size="sm"
					className="gap-2 shrink-0"
					onClick={() => void handleSave()}
					disabled={isSaving || !editor}
				>
					<FloppyDisk className="h-4 w-4" />
					{isSaving ? "Menyimpan…" : "Simpan"}
				</Button>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl w-full mx-auto">
				<div className="space-y-2">
					<Label htmlFor="lesson-title">Judul materi</Label>
					<Input
						id="lesson-title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="text-lg font-semibold"
						placeholder="Judul yang tampil untuk siswa"
					/>
				</div>

				<div className="space-y-4">
					<Tabs
						value={lessonType}
						onValueChange={(val) => setLessonType(val as "TEXT" | "QUIZ")}
						className="w-full"
					>
						<div className="flex items-center justify-between mb-2">
							<Label>Konten Materi</Label>
							<TabsList className="grid w-[200px] grid-cols-2">
								<TabsTrigger value="TEXT">Teks</TabsTrigger>
								<TabsTrigger value="QUIZ">Kuis</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="TEXT" className="space-y-2 mt-0">
							<div className="rounded-lg border bg-card shadow-sm overflow-hidden">
								<div
									className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-2"
									role="toolbar"
									aria-label="Toolbar editor"
								>
									<Button
										type="button"
										variant={editor?.isActive("bold") ? "secondary" : "ghost"}
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() => editor?.chain().focus().toggleBold().run()}
										aria-label="Tebal"
									>
										<Bold className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant={editor?.isActive("italic") ? "secondary" : "ghost"}
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() => editor?.chain().focus().toggleItalic().run()}
										aria-label="Miring"
									>
										<Italic className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant={
											editor?.isActive("underline") ? "secondary" : "ghost"
										}
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() =>
											editor?.chain().focus().toggleUnderline().run()
										}
										aria-label="Garis bawah"
									>
										<UnderlineIcon className="h-4 w-4" />
									</Button>
									<Separator orientation="vertical" className="mx-1 h-6" />
									<Button
										type="button"
										variant={
											editor?.isActive("heading", { level: 1 })
												? "secondary"
												: "ghost"
										}
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() =>
											editor?.chain().focus().toggleHeading({ level: 1 }).run()
										}
										aria-label="Judul tingkat 1"
									>
										<Heading1 className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant={
											editor?.isActive("heading", { level: 2 })
												? "secondary"
												: "ghost"
										}
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() =>
											editor?.chain().focus().toggleHeading({ level: 2 }).run()
										}
										aria-label="Judul tingkat 2"
									>
										<Heading2 className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant={
											editor?.isActive("heading", { level: 3 })
												? "secondary"
												: "ghost"
										}
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() =>
											editor?.chain().focus().toggleHeading({ level: 3 }).run()
										}
										aria-label="Judul tingkat 3"
									>
										<Heading3 className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant={
											editor?.isActive("bulletList") ? "secondary" : "ghost"
										}
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() =>
											editor?.chain().focus().toggleBulletList().run()
										}
										aria-label="Daftar titik"
									>
										<List className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant={
											editor?.isActive("orderedList") ? "secondary" : "ghost"
										}
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() =>
											editor?.chain().focus().toggleOrderedList().run()
										}
										aria-label="Daftar nomor"
									>
										<ListOrdered className="h-4 w-4" />
									</Button>
									<Separator orientation="vertical" className="mx-1 h-6" />
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={openLinkDialog}
										aria-label="Tautan"
									>
										<Link2 className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={openYoutubeDialog}
										aria-label="YouTube"
									>
										<YoutubeIcon className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={openDriveDialog}
										aria-label="Google Drive"
										title="Embed video Google Drive"
									>
										<Video className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={openImageDialog}
										aria-label="Gambar dari tautan"
										title="Sisipkan gambar (URL)"
									>
										<ImageToolbarIcon className="h-4 w-4" />
									</Button>
									<Separator orientation="vertical" className="mx-1 h-6" />
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() => editor?.chain().focus().undo().run()}
										aria-label="Urungkan"
									>
										<Undo2 className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										disabled={!editor}
										onClick={() => editor?.chain().focus().redo().run()}
										aria-label="Ulang"
									>
										<Redo2 className="h-4 w-4" />
									</Button>
								</div>
								<EditorContent
									editor={editor}
									className="lesson-tiptap-editor bg-background"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Konten disimpan sebagai HTML. Siswa melihat tampilan serupa di
								pemutar materi (termasuk video YouTube). Tempel teks markdown
								biasanya dikenali otomatis — termasuk <strong># judul</strong>,
								tabel pipa (GFM), checklist{" "}
								<code className="rounded bg-muted px-1">- [ ]</code>, gambar{" "}
								<code className="rounded bg-muted px-1">![]()</code>, dan kode.
							</p>
						</TabsContent>

						<TabsContent value="QUIZ" className="mt-0">
							<div className="rounded-lg border bg-card shadow-sm p-6">
								<QuizBuilder initialData={quizData} onChange={setQuizData} />
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								Kuis mini untuk menguji pemahaman siswa. Nilai akan tercatat di
								progres siswa.
							</p>
						</TabsContent>
					</Tabs>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
					<Button asChild variant="outline">
						<Link href={`/dashboard/guru/lms/${courseId}`}>
							Kembali ke kurikulum
						</Link>
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={() => setConfirmDeleteOpen(true)}
					>
						<Trash className="h-4 w-4 mr-2" />
						Hapus materi
					</Button>
				</div>
			</div>

			<Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Sisipkan tautan</DialogTitle>
						<DialogDescription>
							Masukkan URL lengkap (https://…)
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-2">
						<Label htmlFor="link-url">URL</Label>
						<Input
							id="link-url"
							value={linkDraft}
							onChange={(e) => setLinkDraft(e.target.value)}
							placeholder="https://"
							onKeyDown={(e) =>
								e.key === "Enter" && (e.preventDefault(), applyLink())
							}
						/>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => setLinkDialogOpen(false)}
						>
							Batal
						</Button>
						<Button type="button" onClick={applyLink}>
							Terapkan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Sisipkan YouTube</DialogTitle>
						<DialogDescription>
							Tempel URL video dari YouTube.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-2">
						<Label htmlFor="yt-url">URL video</Label>
						<Input
							id="yt-url"
							value={youtubeDraft}
							onChange={(e) => setYoutubeDraft(e.target.value)}
							placeholder="https://www.youtube.com/watch?v=…"
							onKeyDown={(e) =>
								e.key === "Enter" && (e.preventDefault(), applyYoutube())
							}
						/>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => setYoutubeDialogOpen(false)}
						>
							Batal
						</Button>
						<Button type="button" onClick={applyYoutube}>
							Sisipkan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={driveDialogOpen} onOpenChange={setDriveDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Sisipkan video Google Drive</DialogTitle>
						<DialogDescription>
							Tempel link share Drive. Pastikan akses file sudah “Anyone with
							the link can view”.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-2">
						<Label htmlFor="drive-url">Link Drive</Label>
						<Input
							id="drive-url"
							value={driveDraft}
							onChange={(e) => setDriveDraft(e.target.value)}
							placeholder="https://drive.google.com/file/d/…/view"
							onKeyDown={(e) =>
								e.key === "Enter" && (e.preventDefault(), applyDrive())
							}
						/>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => setDriveDialogOpen(false)}
						>
							Batal
						</Button>
						<Button type="button" onClick={applyDrive}>
							Sisipkan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Sisipkan gambar dari tautan</DialogTitle>
						<DialogDescription>
							Tempel URL langsung ke file gambar (biasanya berakhiran .png,
							.jpg, .webp). Gambar akan tampil di materi siswa.
						</DialogDescription>
					</DialogHeader>
					<p className="text-[11px] leading-snug text-muted-foreground">
						Punya file di perangkat? Konversi dulu ke tautan di{" "}
						<a
							href="https://image2url.com"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-primary underline underline-offset-2"
						>
							image2url.com
						</a>
						, lalu tempel URL yang dihasilkan di kolom bawah.
					</p>
					<div className="space-y-2 py-2">
						<Label htmlFor="image-url">URL gambar</Label>
						<Input
							id="image-url"
							value={imageDraft}
							onChange={(e) => setImageDraft(e.target.value)}
							placeholder="https://…/gambar.png"
							onKeyDown={(e) =>
								e.key === "Enter" && (e.preventDefault(), applyImage())
							}
						/>
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => setImageDialogOpen(false)}
						>
							Batal
						</Button>
						<Button type="button" onClick={applyImage}>
							Sisipkan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus materi ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Materi akan dihapus permanen dari kurikulum. Siswa tidak lagi bisa
							membukanya.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => void handleDelete()}
							disabled={isDeleting}
						>
							{isDeleting ? "Menghapus…" : "Ya, hapus"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
