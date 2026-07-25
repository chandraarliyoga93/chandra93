'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

export interface ClassPerformanceData {
  className: string;
  averageGrade: number;
  studentCount: number;
}

const chartConfig = {
  averageGrade: {
    label: 'Rata-rata Nilai',
    color: 'var(--primary)'
  },
  studentCount: {
    label: 'Jumlah Siswa',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

interface BarGraphRefinedProps {
  data: ClassPerformanceData[];
  title?: string;
  description?: string;
}

export function BarGraphRefined({
  data,
  title = 'Performa Kelas',
  description = 'Detail rata-rata nilai dan distribusi siswa'
}: BarGraphRefinedProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('averageGrade');

  const totals = React.useMemo(
    () => ({
      averageGrade: data.length > 0 
        ? (data.reduce((acc, curr) => acc + curr.averageGrade, 0) / data.length).toFixed(1)
        : 0,
      studentCount: data.reduce((acc, curr) => acc + curr.studentCount, 0)
    }),
    [data]
  );

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <BarGraphRefinedSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="flex h-[400px] flex-col items-center justify-center border-dashed">
        <p className="text-muted-foreground">Belum ada data</p>
      </Card>
    );
  }

  return (
    <Card className='@container/card overflow-hidden border-none bg-background/50 shadow-sm backdrop-blur-sm'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        </div>
        <div className='flex'>
          {(['averageGrade', 'studentCount'] as const).map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className='relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-all duration-300 hover:bg-muted/50 data-[active=true]:bg-primary/[0.03] sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
                onClick={() => setActiveChart(chart)}
              >
                <span className='text-muted-foreground text-[10px] font-medium uppercase tracking-wider'>
                  {chartConfig[chart].label}
                </span>
                <span className='text-2xl font-bold leading-none tabular-nums sm:text-3xl'>
                  {totals[key]}
                  {key === 'averageGrade' ? '' : ''}
                </span>
                {activeChart === chart && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-10'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[300px] w-full'
        >
          <BarChart
            data={data}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 10
            }}
          >
            <defs>
              <linearGradient id='fillBarPrimary' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              vertical={false} 
              strokeDasharray="4 4" 
              className="stroke-muted/50" 
            />
            <XAxis
              dataKey='className'
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground"
            />
            <YAxis 
              hide={activeChart !== 'averageGrade'} 
              domain={activeChart === 'averageGrade' ? [0, 100] : ['auto', 'auto']}
              tickLine={false}
              axisLine={false}
              className="text-[10px] text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
              content={
                <ChartTooltipContent
                  className='w-[180px] border-none bg-background/90 p-3 shadow-2xl backdrop-blur-md'
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 w-2 rounded-full bg-primary" 
                        />
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label || name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-foreground">
                        {value}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill='url(#fillBarPrimary)'
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
              animationEasing="ease-out"
              className="transition-all duration-300"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function BarGraphRefinedSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <Skeleton className='h-6 w-[180px]' />
          <Skeleton className='h-4 w-[250px]' />
        </div>
        <div className='flex'>
          {[1, 2].map((i) => (
            <div
              key={i}
              className='relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
            >
              <Skeleton className='h-3 w-[80px]' />
              <Skeleton className='h-8 w-[100px] sm:h-10' />
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-10 sm:px-6'>
        <div className='flex aspect-auto h-[300px] w-full items-end justify-around gap-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className='w-full rounded-t-lg bg-muted/30'
              style={{
                height: `${Math.max(20, Math.random() * 80)}%`
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
