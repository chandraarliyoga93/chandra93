import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { StudentTopNav } from "@/components/layout/StudentTopNav";
import { PageTransition } from "@/components/layout/PageTransition";

export const dynamic = "force-dynamic";

export default function SiswaLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-neo-bg font-gen-z selection:bg-yellow-300 selection:text-black flex flex-col siswa-theme transition-colors">
			<StudentTopNav />

			{/* Main Content Area */}
			{/* pb-24 for mobile bottom nav, md:pb-10 for desktop */}
			<main className="w-full min-w-0 max-w-none min-h-0 flex-1 flex flex-col px-2 sm:px-4 py-4 sm:py-6 pb-24 md:pb-10 md:mx-auto md:max-w-7xl md:px-6">
				<PageTransition>{children}</PageTransition>
			</main>

			<StudentBottomNav />
		</div>
	);
}
