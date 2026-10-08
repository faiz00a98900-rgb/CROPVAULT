"use client";

import { useEffect, type ReactNode } from "react";
import { X, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "pop-in relative w-full max-w-lg rounded-t-3xl bg-base p-5 shadow-neu sm:rounded-xl2",
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-base font-bold text-ink">{title}</h3>}
          <button onClick={onClose} className="neu-icon-btn ml-auto h-9 w-9" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} className="max-w-md">
      <div className="flex gap-4">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-base shadow-neu-sm",
            tone === "danger" ? "text-chili" : "text-amber"
          )}
        >
          <TriangleAlert className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <div className="mt-1 text-sm text-ink-soft">{message}</div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="neu-btn" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              className={tone === "danger" ? "neu-btn-danger" : "neu-btn-primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
