import React from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';

// Shared bottom sheet for the in-session console.
export default function ConsoleSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className = '',
  onOverlayClick,
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-50 bg-black/70"
          onClick={onOverlayClick}
        />
        <Drawer.Content className={`console-sheet ${className}`}>
          <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--console-line)]" />
          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
            <div className="min-w-0">
              <Drawer.Title className="truncate text-[15px] font-semibold text-[var(--console-chalk)]">
                {title}
              </Drawer.Title>
              <Drawer.Description className="sr-only">
                {description || title}
              </Drawer.Description>
            </div>
            <Drawer.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="console-icon-button h-9 w-9 shrink-0"
              >
                <X size={16} />
              </button>
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer && (
            <div
              className="border-t border-[var(--console-line)] px-5 pt-3"
              style={{ paddingBottom: 'max(0.9rem, env(safe-area-inset-bottom))' }}
            >
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
