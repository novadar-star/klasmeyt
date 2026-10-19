"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui";

/**
 * Modal motion (Emil): opens from scale(0.96)+fade with a strong ease-out in 220ms,
 * closes faster (150ms). Stays centered — modals aren't anchored to a trigger.
 */
export function Modal({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-900/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-panel bg-white p-6 shadow-[0_24px_64px_-12px_rgba(12,26,61,0.35)] focus:outline-none data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in">
          <Dialog.Title className="pr-8 text-lg font-semibold text-brand-800">{title}</Dialog.Title>
          {description ? <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
          <div className="mt-5">{children}</div>
          <Dialog.Close className="absolute right-4 top-4 rounded-control p-1 text-muted transition-colors duration-150 hover:bg-paper hover:text-ink" aria-label="Close">
            <X className="size-5" aria-hidden />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Destructive actions always ask first (Web Interface Guidelines).
 * Usage: <ConfirmButton title="Decline request?" confirmLabel="Decline" onConfirm={...}>Decline</ConfirmButton>
 */
export function ConfirmButton({
  children, title, body, confirmLabel, onConfirm, variant = "danger", size, danger = true, disabled,
}: {
  children: React.ReactNode;
  title: string;
  body?: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown> | unknown;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  danger?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} disabled={disabled} onClick={() => setOpen(true)}>{children}</Button>
      <Modal open={open} onOpenChange={(v) => !busy && setOpen(v)} title={title} description={body}>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Keep it</Button>
          <Button
            variant={danger ? "danger-solid" : "primary"}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                setOpen(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
