"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, variant = 'default' }: { className?: string, variant?: 'default' | 'circle' | 'text' }) {
  return (
    <div className={cn(
      "animate-pulse bg-surface-200",
      variant === 'circle' && "rounded-full",
      variant === 'text' && "h-4 w-2/3 rounded-lg",
      variant === 'default' && "rounded-2xl",
      className
    )} />
  );
}

export function SkeletonGrid({ cols = 4, rows = 1, className = "" }) {
  return (
    <div className={cn("grid gap-6", `grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols}`, className)}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}
