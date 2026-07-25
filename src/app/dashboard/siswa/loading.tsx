import { Skeleton } from "@/components/ui/skeleton";

export default function StudentLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 w-full rounded-none border-4 border-neo-border" />
        <Skeleton className="h-32 w-full rounded-none border-4 border-neo-border" />
        <Skeleton className="h-32 w-full rounded-none border-4 border-neo-border" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px] rounded-none border-4 border-neo-border" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[220px] w-full rounded-none border-4 border-neo-border" />
          <Skeleton className="h-[220px] w-full rounded-none border-4 border-neo-border" />
          <Skeleton className="h-[220px] w-full rounded-none border-4 border-neo-border" />
        </div>
      </div>
    </div>
  );
}
