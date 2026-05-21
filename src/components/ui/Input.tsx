import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Input Component
 *
 * Accessible form input with label, error, and helper text support
 *
 * Usage:
 * <Input label="Email" type="email" placeholder="your@email.com" />
 * <Input label="Password" type="password" error="Password is required" />
 * <Input helperText="Must be at least 8 characters" />
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      icon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium',
              error ? 'text-error-600' : 'text-foreground'
            )}
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative flex items-center">
          {/* Left Icon */}
          {icon && (
            <div className="absolute left-4 flex items-center text-muted pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input Field */}
          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full h-12 px-4 rounded-md text-base',
              'bg-background border-2 transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              // Border states
              error
                ? 'border-error-500 focus-visible:border-error-500'
                : 'border-input-border focus-visible:border-brand-500',
              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed',
              // Icon padding
              icon && 'pl-12',
              rightIcon && 'pr-12',
              className
            )}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-4 flex items-center text-muted pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-error-600 flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
