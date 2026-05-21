'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Modal Component
 *
 * Accessible dialog/modal with backdrop and animations
 *
 * Usage:
 * <Modal open={isOpen} onClose={handleClose}>
 *   <Modal.Header>
 *     <h2>Confirm Action</h2>
 *   </Modal.Header>
 *   <Modal.Content>
 *     Are you sure?
 *   </Modal.Content>
 *   <Modal.Footer>
 *     <Button variant="secondary">Cancel</Button>
 *     <Button>Confirm</Button>
 *   </Modal.Footer>
 * </Modal>
 */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      children,
      maxWidth = 'md',
      closeOnEscape = true,
      closeOnBackdropClick = true,
    },
    ref
  ) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Handle keyboard escape
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape && open) {
          onClose();
        }
      };

      if (open) {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.body.style.overflow = 'unset';
        };
      }
    }, [open, closeOnEscape, onClose]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    if (!open) return null;

    const maxWidthClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    };

    return (
      <div
        className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50"
        onClick={handleBackdropClick}
        role="presentation"
      >
        <div
          ref={ref || dialogRef}
          className={cn(
            'bg-card text-card-foreground rounded-lg shadow-premium',
            'animate-scale-in',
            'w-full',
            maxWidthClasses[maxWidth]
          )}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// Modal Header
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between p-6 border-b border-border', className)}
    {...props}
  />
));
ModalHeader.displayName = 'ModalHeader';

// Modal Content
const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6', className)} {...props} />
));
ModalContent.displayName = 'ModalContent';

// Modal Footer
const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-3 p-6 border-t border-border',
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = 'ModalFooter';

// Modal Close Button
const ModalClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors',
      className
    )}
    {...props}
  >
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
));
ModalClose.displayName = 'ModalClose';

export { Modal, ModalHeader, ModalContent, ModalFooter, ModalClose };
