"use client";

/**
 * Files chosen during sign-up are kept in this browser (IndexedDB) until the student confirms their email
 * and logs in; then the status page uploads them. Nothing leaves the device before that.
 * Entries expire after 3 days.
 */
import type { Doc } from "@/lib/types";

const DB = "klasmeyt";
const STORE = "pending-docs";
const TTL = 3 * 24 * 60 * 60 * 1000;

export type PendingDoc = { email: string; type: Doc["type"]; name: string; blob: Blob; savedAt: number };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: ["email", "type"] });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function savePending(email: string, docs: { type: Doc["type"]; file: File }[]) {
  try {
    for (const d of docs) {
      await tx("readwrite", (s) => s.put({ email: email.toLowerCase(), type: d.type, name: d.file.name, blob: d.file, savedAt: Date.now() } satisfies PendingDoc));
    }
    return true;
  } catch {
    return false; // private mode / storage blocked: the student uploads from the status page instead
  }
}

export async function loadPending(email: string): Promise<PendingDoc[]> {
  try {
    const all = (await tx("readonly", (s) => s.getAll())) as PendingDoc[];
    return all.filter((d) => d.email === email.toLowerCase() && Date.now() - d.savedAt < TTL);
  } catch {
    return [];
  }
}

export async function clearPending(email: string, type: Doc["type"]) {
  try {
    await tx("readwrite", (s) => s.delete([email.toLowerCase(), type]));
  } catch {
    /* ignore */
  }
}
