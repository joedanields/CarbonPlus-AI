"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * ConfirmDialog — Accessible Confirmation Modal
 *
 * Replaces native `window.confirm()` with an accessible dialog
 * that supports focus trapping, Escape to close, and proper ARIA attributes.
 * WCAG 2.1 Level A requirement (2.1.2 No Keyboard Trap).
 */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when dialog opens (safe default)
  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  // Handle Escape key
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }

      // Focus trap: Tab / Shift+Tab cycles within dialog
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    },
    [onCancel]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="panel mx-4 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-white"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="mt-2 text-sm leading-6 text-slate-400"
        >
          {message}
        </p>
        <div className="mt-5 flex gap-3 justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
