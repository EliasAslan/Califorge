import * as React from "react";

// Small, dependency-free toast store compatible with the Radix Toast primitives
// used by toaster.jsx. The store lives outside React so toast() can be called
// from event handlers and non-component modules.
const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5_000;

let toastCounter = 0;
const listeners = new Set();
const removalTimers = new Map();

let memoryState = { toasts: [] };

function nextId() {
  toastCounter = (toastCounter + 1) % Number.MAX_SAFE_INTEGER;
  return String(toastCounter);
}

function notify() {
  listeners.forEach((listener) => listener(memoryState));
}

function updateState(updater) {
  memoryState = updater(memoryState);
  notify();
}

function scheduleRemoval(id) {
  if (removalTimers.has(id)) return;

  const timer = setTimeout(() => {
    removalTimers.delete(id);
    updateState((state) => ({
      ...state,
      toasts: state.toasts.filter((item) => item.id !== id),
    }));
  }, TOAST_REMOVE_DELAY);

  removalTimers.set(id, timer);
}

function dismissToast(id) {
  const idsToDismiss = memoryState.toasts
    .filter((item) => !id || item.id === id)
    .map((item) => item.id);

  idsToDismiss.forEach(scheduleRemoval);

  updateState((state) => ({
    ...state,
    toasts: state.toasts.map((item) =>
      !id || item.id === id ? { ...item, open: false } : item,
    ),
  }));
}

function toast(props) {
  const id = nextId();

  const dismiss = () => dismissToast(id);
  const update = (nextProps) => {
    updateState((state) => ({
      ...state,
      toasts: state.toasts.map((item) =>
        item.id === id ? { ...item, ...nextProps, id } : item,
      ),
    }));
  };

  updateState((state) => ({
    ...state,
    toasts: [
      {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss();
        },
      },
      ...state.toasts,
    ].slice(0, TOAST_LIMIT),
  }));

  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.add(setState);
    setState(memoryState);

    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: dismissToast,
  };
}

export { toast, useToast };
