import { useState } from "react";
import { Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePasswordGate } from "@/hooks/usePasswordGate";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const gate = usePasswordGate();

  if (gate.status === "loading") {
    return (
      <GateCard title="Wird geladen …">
        <RefreshCw className="mx-auto size-6 animate-spin text-muted-foreground" />
      </GateCard>
    );
  }

  if (gate.status === "setup") {
    return <SetupForm onSubmit={gate.setup} />;
  }

  if (gate.status === "locked") {
    return <UnlockForm onSubmit={gate.unlock} />;
  }

  return <>{children}</>;
}

export function GateCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {children}
      </div>
    </main>
  );
}

function SetupForm({ onSubmit }: { onSubmit: (password: string) => Promise<void> }) {
  const [error, setError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const repeat = String(data.get("repeat") ?? "");
    if (password.length < 4) {
      setError("Bitte mindestens 4 Zeichen verwenden.");
      return;
    }
    if (password !== repeat) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    await onSubmit(password);
  }

  return (
    <GateCard title="Passwort festlegen">
      <ShieldCheck className="mx-auto size-8 text-primary" />
      <p className="text-sm text-muted-foreground">
        Diese Galerie ist nur für Sie. Legen Sie beim ersten Start ein Passwort fest – es wird nur auf
        diesem Rechner gespeichert.
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Passwort"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
        <input
          name="repeat"
          type="password"
          autoComplete="new-password"
          placeholder="Passwort wiederholen"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          Passwort speichern
        </Button>
      </form>
    </GateCard>
  );
}

function UnlockForm({ onSubmit }: { onSubmit: (password: string) => Promise<boolean> }) {
  const [error, setError] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const ok = await onSubmit(password);
    setError(!ok);
  }

  return (
    <GateCard title="Fotogalerie entsperren">
      <Lock className="mx-auto size-8 text-primary" />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          placeholder="Passwort"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
        {error && <p className="text-sm text-destructive">Falsches Passwort.</p>}
        <Button type="submit" className="w-full">
          Entsperren
        </Button>
      </form>
    </GateCard>
  );
}
