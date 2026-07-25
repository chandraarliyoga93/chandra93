import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GuruLmsOverviewStatsProps = {
  total: number;
  published: number;
  assigned: number;
};

export function GuruLmsOverviewStats({
  total,
  published,
  assigned,
}: GuruLmsOverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardDescription>Total kursus</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{total}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="bg-emerald-500/5 border-emerald-500/30">
        <CardHeader className="pb-2">
          <CardDescription>Published</CardDescription>
          <CardTitle className="text-2xl tabular-nums text-emerald-700 dark:text-emerald-400">
            {published}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="bg-sky-500/5 border-sky-500/30">
        <CardHeader className="pb-2">
          <CardDescription>Sudah Di-assign</CardDescription>
          <CardTitle className="text-2xl tabular-nums text-sky-800 dark:text-sky-300">
            {assigned}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
