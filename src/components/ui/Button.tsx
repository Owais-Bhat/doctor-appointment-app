import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button Component
 *
 * Usage:
 * <Button>Click me</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="ghost" size="sm">Small ghost</Button>
 * <Button disabled>Disabled</Button>
 * <Button isLoading>Loading...</Button>
 */

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
  {
    variants: {
      variant: {
        // Primary - Brand Blue
        primary:
          'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-md hover:shadow-lg',

        // Secondary - Subtle
        secondary:
          'bg-surface-200 text-surface-900 hover:bg-surface-300 active:bg-surface-400 dark:bg-surface-700 dark:text-surface-50 dark:hover:bg-surface-600',

        // Ghost - No background
        ghost:
          'bg-transparent text-brand-500 hover:bg-brand-50 active:bg-brand-100 dark:hover:bg-brand-500/10 dark:active:bg-brand-500/20',

        // Danger - Destructive action
        danger:
          'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-md hover:shadow-lg',

        // Success
        success:
          'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-md hover:shadow-lg',

        // Outline - Bordered
        outline:
          'border-2 border-brand-500 text-brand-500 hover:bg-brand-50 active:bg-brand-100 dark:hover:bg-brand-500/10',
      },

      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-10 px-4 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },

      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {/* Left Icon */}
        {leftIcon && !isLoading && <span className="flex-shrink-0">{leftIcon}</span>}

        {/* Loading Spinner */}
        {isLoading && (
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Button Text */}
        {children && <span>{children}</span>}

        {/* Right Icon */}
        {rightIcon && !isLoading && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
