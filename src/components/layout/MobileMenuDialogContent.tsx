"use client";

import type { ReactNode, RefObject } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { iconButtonClasses } from "@/components/ui/icon-button-styles";

export function MobileMenuDialogContent({
  id,
  titleId,
  open,
  onClose,
  returnFocusRef,
  closeIcon,
  logo,
  children,
}: {
  id: string;
  titleId: string;
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  closeIcon: ReactNode;
  logo: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog
      id={id}
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      variant="fullscreen"
      returnFocusRef={returnFocusRef}
      closeOnBackdrop={false}
    >
      <div
        className="flex min-h-0 flex-1 flex-col"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) onClose();
        }}
      >
        <div className="wrap flex h-14 w-full shrink-0 items-center justify-between gap-5 border-b border-header-line">
          {logo}
          <button
            type="button"
            aria-label="Fermer le menu"
            data-autofocus
            className={iconButtonClasses}
            onClick={onClose}
          >
            {closeIcon}
          </button>
        </div>
        <nav aria-labelledby={titleId} className="wrap w-full flex-1 overflow-y-auto py-8">
          <h2 id={titleId} className="sr-only">
            Menu
          </h2>
          {children}
        </nav>
      </div>
    </Dialog>
  );
}
