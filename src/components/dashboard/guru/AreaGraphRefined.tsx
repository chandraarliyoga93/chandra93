'use client';

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

interface AttendanceTrend {
  date: string;
  percentage: number;
}

interface AreaGraphRefinedProps {
  data: AttendanceTrend[];
  title?: string;
  description?: string;
  trendValue?: string;
  dateRangeLabel?: string;
}

const chartConfig = {
  attendance: {
    label: 'Kehadiran',
    color: 'hsl(var(--primary))'
  }
} satisfies ChartConfig;

export function AreaGraphRefined({
  data,
  title = 'Tren Kehadiran',
  description = 'Menampilkan persentase kehadiran dari waktu ke waktu',
  trendValue,
  dateRangeLabel
}: AreaGraphRefinedProps) {
  if (!data || data.length === 0) {
    return (
      <Card className='overflow-hidden border-none shadow-md'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-xl font-bold tracking-tight'>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className='flex h-[300px] items-center justify-center text-muted-foreground'>
          Belum ada data
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='overflow-hidden border-none shadow-md transition-all hover:shadow-lg'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-xl font-bold tracking-tight'>{title}</CardTitle>
            <CardDescription className='text-muted-foreground'>
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[300px] w-full'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart
              data={data}
              margin={{
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
              }}
            >
              <defs>
                <linearGradient id='attendanceGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--color-attendance)'
                    stopOpacity={0.3}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--color-attendance)'
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid 
                vertical={false} 
                strokeDasharray='3 3' 
                stroke='hsl(var(--muted-foreground) / 0.1)' 
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={32}
                className='text-xs font-medium text-muted-foreground'
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('id-ID', {
                    month: 'short',
                    day: 'numeric'
                  });
                }}
              />
              <YAxis
                hide
                domain={[0, 100]}
              />
              <ChartTooltip
                cursor={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 1,
                  strokeDasharray: '4 4'
                }}
                content={
                  <ChartTooltipContent 
                    indicator='line'
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                    }}
                    formatter={(value) => [`${value}%`, 'Kehadiran']}
                  />
                }
              />
              <Area
                dataKey='percentage'
                type='monotone'
                fill='url(#attendanceGradient)'
                stroke='var(--color-attendance)'
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: 'hsl(var(--background))',
                  stroke: 'var(--color-attendance)',
                  strokeWidth: 2,
                  fillOpacity: 1
                }}
                activeDot={{
                  r: 6,
                  fill: 'var(--color-attendance)',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
                animationDuration={1500}
                animationEasing='ease-in-out'
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className='bg-muted/30 pt-4 pb-6'>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-1'>
            {trendValue && (
              <div className='flex items-center gap-2 font-semibold text-primary leading-none'>
                {trendValue} <TrendingUp className='h-4 w-4 animate-bounce' />
              </div>
            )}
            {dateRangeLabel && (
              <div className='text-xs font-medium text-muted-foreground leading-none'>
                {dateRangeLabel}
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
