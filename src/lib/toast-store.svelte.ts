import { writable } from 'svelte/store';

export interface ToastItem { id: number; msg: string; duration: number }

let _nextId = 0

export const toasts = writable<ToastItem[]>([])

export function addToast(msg: string, duration = 2400): void {
  const id = ++_nextId
  const toast: ToastItem = { id, msg, duration }
  
  toasts.update((t) => [...t, toast])
  
  setTimeout(() => removeToast(id), duration)
}

function removeToast(id: number) {
  toasts.update((t) => t.filter((x: ToastItem) => x.id !== id))
}

/** Clear all active toasts and reset counters (for unmount / game reset). */
export function removeAllToasts(): void {
  _nextId = 0;
  toasts.set([]);
}
