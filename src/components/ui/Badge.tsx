import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge Component
 *
 * Status indicator component for appointments, users, etc.
 *
 * Usage:
 * <Badge variant="success">Confirmed</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="error">Cancelled</Badge>
 * <Badge variant="info">Upcoming</Badge>
 */

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        success:
          'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400',
        warning:
          'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400',
        error:
          'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400',
        info: 'bg-info-100 text-info-700 dark:bg-info-500/20 dark:text-info-400',
        brand:
          'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
        secondary:
          'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200',
      },
      size: {
        sm: 'text-xs px-2 py-1',
        md: 'text-xs px-3 py-1',
        lg: 'text-sm px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <span className="mr-1 flex-shrink-0">{icon}</span>}
      {children}
    </div>
  )
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
