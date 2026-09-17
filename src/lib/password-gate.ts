import { get, set, del } from "idb-keyval";

const GATE_KEY = "photo-gate-v1";
const SESSION_KEY = "photo-gate-unlocked";

type GateRecord = { salt: string; hash: string };

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export async function hasPassword(): Promise<boolean> {
  return (await get<GateRecord>(GATE_KEY)) !== undefined;
}

export async function setPassword(password: string): Promise<void> {
  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  await set(GATE_KEY, { salt, hash } satisfies GateRecord);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const record = await get<GateRecord>(GATE_KEY);
  if (!record) return false;
  return (await hashPassword(password, record.salt)) === record.hash;
}

export async function resetPassword(): Promise<void> {
  await del(GATE_KEY);
}

export function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSessionUnlocked(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSessionUnlocked(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
