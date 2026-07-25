import Link from "next/link";
import { Book, Plus } from "iconoir-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { type CoursePipelineState, getLmsStatusLabelIdn } from "@/lib/lms/flow";
import { cn } from "@/lib/utils";
import { normalizeCoverImageUrl } from "@/lib/lms/course-cover";

export type GuruPipelineCourse = {
	id: string;
	title: string;
	description: string | null;
	coverImage: string | null;
};

export type GuruPipelineCourseListItem = GuruPipelineCourse & {
	pipelineState: CoursePipelineState;
};

function pipelineBadgeVariant(
	state: CoursePipelineState,
): "secondary" | "outline" | "default" {
	if (state === "PUBLISHED") return "default";
	if (state === "DRAFT") return "secondary";
	return "outline";
}

export function getPipelineQuickAction(
	courseId: string,
	state: CoursePipelineState,
): { label: string; href: string } {
	const editorHref = `/dashboard/guru/lms/${courseId}`;
	const settingsHref = `/dashboard/guru/lms/${courseId}/settings`;

	switch (state) {
		case "DRAFT":
			return { label: "Lengkapi Materi", href: editorHref };
		case "READY_TO_ASSIGN":
			return { label: "Atur Kelas", href: settingsHref };
		case "ASSIGNED":
			return { label: "Atur Kelas", href: settingsHref };
		case "PUBLISHED":
			return { label: "Buka Editor", href: editorHref };
	}
}

type GuruCoursePipelineCardProps = {
	course: GuruPipelineCourse;
	pipelineState: CoursePipelineState;
};

export function GuruCoursePipelineCard({
	course,
	pipelineState,
}: GuruCoursePipelineCardProps) {
	const badgeLabel = getLmsStatusLabelIdn(pipelineState);
	const { label: actionLabel, href: actionHref } = getPipelineQuickAction(
		course.id,
		pipelineState,
	);

	return (
		<Card
			className={cn(
				"flex flex-col overflow-hidden border-muted-foreground/20 transition-shadow hover:shadow-md",
			)}
		>
			<CardHeader className="pb-3">
				<div className="flex justify-between items-start gap-4">
					<CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
					<Badge variant={pipelineBadgeVariant(pipelineState)}>
						{badgeLabel}
					</Badge>
				</div>
				<CardDescription className="line-clamp-3 mt-2">
					{course.description || "Tidak ada deskripsi"}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-1">
				{course.coverImage ? (
					<div className="w-full h-36 bg-muted rounded-md overflow-hidden relative">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={normalizeCoverImageUrl(course.coverImage)}
							alt={course.title}
							className="w-full h-full object-cover"
						/>
					</div>
				) : (
					<div className="w-full h-36 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
						<Book className="w-8 h-8 opacity-50" />
					</div>
				)}
			</CardContent>
			<CardFooter className="pt-3 border-t flex flex-col gap-2 sm:flex-row">
				<Button
					asChild
					variant="default"
					className="w-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<Link href={actionHref}>{actionLabel}</Link>
				</Button>
				<Button
					asChild
					variant="secondary"
					className="w-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<Link href={`/dashboard/guru/lms/${course.id}`}>Detail kursus</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

/** Empty list placeholder for the guru LMS index (command center). */
export function GuruLmsEmptyCoursesState() {
	return (
		<Card
			data-testid="guru-lms-empty-courses"
			className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/20"
		>
			<Book className="w-12 h-12 text-muted-foreground mb-4" />
			<CardTitle className="mb-2">Belum ada kursus</CardTitle>
			<CardDescription className="mb-4">
				Mulai buat kursus pertama Anda untuk membagikan materi pembelajaran ke
				siswa.
			</CardDescription>
			<Button asChild variant="outline">
				<Link href="/dashboard/guru/lms/create">
					<Plus className="w-4 h-4 mr-2" />
					Buat Kursus Baru
				</Link>
			</Button>
		</Card>
	);
}

type GuruLmsCoursesGridProps = {
	courses: GuruPipelineCourseListItem[];
};

export function GuruLmsCoursesGrid({ courses }: GuruLmsCoursesGridProps) {
	if (courses.length === 0) {
		return <GuruLmsEmptyCoursesState />;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{courses.map((course) => (
				<GuruCoursePipelineCard
					key={course.id}
					course={{
						id: course.id,
						title: course.title,
						description: course.description,
						coverImage: course.coverImage,
					}}
					pipelineState={course.pipelineState}
				/>
			))}
		</div>
	);
}
