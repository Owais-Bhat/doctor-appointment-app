import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Alert Component
 *
 * Display alert messages with icon and optional action
 *
 * Usage:
 * <Alert variant="info">
 *   <AlertIcon />
 *   <AlertTitle>Heads up!</AlertTitle>
 *   <AlertDescription>You can add components and dependencies to your app.</AlertDescription>
 * </Alert>
 */

const alertVariants = cva(
  'relative w-full rounded-lg border-2 p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-background border-border',
        success:
          'border-success-500/50 bg-success-50 text-success-800 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400',
        destructive:
          'border-error-500/50 bg-error-50 text-error-800 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400',
        warning:
          'border-warning-500/50 bg-warning-50 text-warning-800 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400',
        info: 'border-info-500/50 bg-info-50 text-info-800 dark:border-info-500/20 dark:bg-info-500/10 dark:text-info-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, alertVariants };
