"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";

export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string; // default "Yes"
  cancelLabel?: string; // default "No"
};

type ConfirmDialogProps = ConfirmOptions & {
  // Put your logo at public/logo.png (or pass another path). If the image
  // can't be loaded, a trash icon is shown instead.
  logoSrc?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  logoSrc = "/logo.png",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const titleId = useId();
  const messageId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // "No" is focused first, so pressing Enter by accident never deletes.
    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }

      // Keep Tab inside the dialog.
      if (event.key === "Tab") {
        const buttons = cardRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not([disabled])",
        );
        if (!buttons || buttons.length === 0) return;
        const first = buttons[0]!;
        const last = buttons[buttons.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(event) => {
        // Clicking the dim background counts as "No".
        if (event.target === event.currentTarget) onCancelRef.current();
      }}
    >
      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl bg-background px-8 py-8 text-center shadow-2xl ring-1 ring-border animate-in zoom-in-95 duration-150"
      >
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[3px] border-destructive/25" />
          {logoFailed ? (
            <Trash2 className="h-8 w-8 text-destructive" />
          ) : (
            <>
              <Image
                src={logoSrc}
                alt=""
                width={44}
                height={44}
                priority
                onError={() => setLogoFailed(true)}
                className="h-11 w-11 object-contain"
              />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white ring-4 ring-background">
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            First <span className="font-light">Depot</span>
          </p>
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {message && (
            <p
              id={messageId}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {message}
            </p>
          )}
        </div>

        <div className="flex w-full gap-3">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

/**
 * Drop-in replacement for window.confirm:
 *
 *   const { confirm, dialog } = useConfirm();
 *   if (!(await confirm({ title: "Delete this product?" }))) return;
 *   ...
 *   return <>{dialog} ...your UI...</>;
 */
export const useConfirm = () => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((answer: boolean) => void) | null>(null);

  const settle = useCallback((answer: boolean) => {
    resolverRef.current?.(answer);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    // A second request while one is open counts as "No" for the first.
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(next);
    });
  }, []);

  // If the component goes away while the question is open, answer "No".
  useEffect(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);

  const dialog = options ? (
    <ConfirmDialog
      {...options}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { confirm, dialog };
};

export default ConfirmDialog;
