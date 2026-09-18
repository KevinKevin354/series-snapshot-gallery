import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FilterState = { include: string[]; exclude: string[] };

export const emptyFilter = (): FilterState => ({ include: [], exclude: [] });

export function filterStatus(filter: FilterState, value: string) {
  if (filter.exclude.includes(value)) return "exclude" as const;
  if (filter.include.includes(value)) return "include" as const;
  return "off" as const;
}

/** Klick schaltet ein, Doppelklick schließt aus. */
export function cycleInclude(filter: FilterState, value: string): FilterState {
  const status = filterStatus(filter, value);
  if (status === "exclude")
    return { include: filter.include, exclude: filter.exclude.filter((v) => v !== value) };
  if (status === "include")
    return { include: filter.include.filter((v) => v !== value), exclude: filter.exclude };
  return { include: [...filter.include, value], exclude: filter.exclude };
}

export function setExclude(filter: FilterState, value: string): FilterState {
  return {
    include: filter.include.filter((v) => v !== value),
    exclude: filter.exclude.includes(value) ? filter.exclude : [...filter.exclude, value],
  };
}

/** Ausschluss hat Vorrang. Mehrere Auswahlen müssen ALLE zutreffen (UND). */
export function matchesFilter(filter: FilterState, values: string[]) {
  if (values.some((v) => filter.exclude.includes(v))) return false;
  if (filter.include.length === 0) return true;
  return filter.include.every((v) => values.includes(v));
}

type GroupProps = {
  title: string;
  values: string[];
  counts?: Record<string, number>;
  filter: FilterState;
  onChange: (next: FilterState) => void;
  emptyHint?: string;
};

export function FilterGroup({ title, values, counts, filter, onChange, emptyHint }: GroupProps) {
  const active = filter.include.length + filter.exclude.length;

  return (
    <section className="space-y-2">
      <header className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {active > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => onChange(emptyFilter())}
          >
            <X className="size-3" /> leeren
          </Button>
        )}
      </header>

      {values.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyHint ?? "Nichts vorhanden."}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => {
            const status = filterStatus(filter, value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(cycleInclude(filter, value))}
                onDoubleClick={() => onChange(setExclude(filter, value))}
                title="Klick: muss zutreffen · Doppelklick: ausschließen"
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  status === "include"
                    ? "border-primary bg-primary text-primary-foreground"
                    : status === "exclude"
                      ? "border-destructive bg-destructive text-destructive-foreground line-through"
                      : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {value}
                {counts?.[value] !== undefined && (
                  <span className="ml-1.5 opacity-60">{counts[value]}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
