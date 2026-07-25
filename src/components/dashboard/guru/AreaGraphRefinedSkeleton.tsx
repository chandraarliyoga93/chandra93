import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AreaGraphRefinedSkeleton() {
  return (
    <Card className='overflow-hidden border-none shadow-md'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-6 w-[200px]' />
            <Skeleton className='h-4 w-[280px]' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <div className='relative aspect-auto h-[300px] w-full overflow-hidden rounded-md'>
          {/* Simulated chart area */}
          <div className='absolute inset-0 bg-linear-to-t from-primary/5 to-transparent' />
          
          {/* Simulated grid lines */}
          <div className='absolute inset-0 flex flex-col justify-between py-8 opacity-20'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-[1px] w-full border-t border-dashed border-muted-foreground' />
            ))}
          </div>
          
          {/* Simulated wave line */}
          <svg className='absolute inset-0 h-full w-full opacity-20' preserveAspectRatio='none' viewBox='0 0 100 100'>
            <path
              d='M0,80 Q25,20 50,60 T100,40'
              fill='none'
              stroke='hsl(var(--primary))'
              strokeWidth='2'
            />
          </svg>
        </div>
      </CardContent>
      <CardFooter className='bg-muted/30 pt-4 pb-6'>
        <div className='flex w-full items-start gap-2'>
          <div className='grid gap-2'>
            <Skeleton className='h-4 w-[150px]' />
            <Skeleton className='h-3 w-[100px]' />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
