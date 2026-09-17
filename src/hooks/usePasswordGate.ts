import { useCallback, useEffect, useState } from "react";
import {
  clearSessionUnlocked,
  hasPassword,
  isSessionUnlocked,
  markSessionUnlocked,
  setPassword,
  verifyPassword,
} from "@/lib/password-gate";

export type GateStatus = "loading" | "setup" | "locked" | "unlocked";

export function usePasswordGate() {
  const [status, setStatus] = useState<GateStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const exists = await hasPassword();
      if (cancelled) return;
      if (!exists) setStatus("setup");
      else setStatus(isSessionUnlocked() ? "unlocked" : "locked");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setup = useCallback(async (password: string) => {
    await setPassword(password);
    markSessionUnlocked();
    setStatus("unlocked");
  }, []);

  const unlock = useCallback(async (password: string) => {
    const ok = await verifyPassword(password);
    if (ok) {
      markSessionUnlocked();
      setStatus("unlocked");
    }
    return ok;
  }, []);

  const lock = useCallback(() => {
    clearSessionUnlocked();
    setStatus("locked");
  }, []);

  return { status, setup, unlock, lock };
}
