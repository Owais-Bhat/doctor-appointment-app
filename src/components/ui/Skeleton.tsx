import { cn } from '@/lib/utils';

/**
 * Skeleton Component
 *
 * Placeholder loading state using shimmer animation
 *
 * Usage:
 * <Skeleton className="h-12 w-full rounded-lg" />
 * <Skeleton className="h-4 w-3/4 mt-4" />
 */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-200 dark:bg-surface-700',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
