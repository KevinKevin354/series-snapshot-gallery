import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePhotoUrl } from "@/components/PhotoThumb";
import type { LibraryMeta, Photo } from "@/lib/photo-library";
import { personsOf } from "@/lib/photo-library";

type Props = {
  photos: Photo[];
  index: number;
  meta: LibraryMeta;
  allPersons: string[];
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onToggleTag: (tag: string) => void;
  onAddTag: (name: string) => void;
  onTogglePerson: (person: string, on: boolean) => void;
  onToggleHidden: () => void;
};

/** Großansicht mit Bearbeitungsspalte: Kennzeichen und Personen pro Foto pflegen. */
export function PhotoEditor({
  photos,
  index,
  meta,
  allPersons,
  onIndexChange,
  onClose,
  onToggleTag,
  onAddTag,
  onTogglePerson,
  onToggleHidden,
}: Props) {
  const photo = photos[index];
  const url = usePhotoUrl(photo);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [newTag, setNewTag] = useState("");
  const [personSearch, setPersonSearch] = useState("");

  const step = useCallback(
    (delta: number) => {
      if (photos.length === 0) return;
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange],
  );

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* Vollbild abgelehnt */
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        if (event.key === "Escape") target.blur();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "Escape") {
        if (!document.fullscreenElement) onClose();
      } else if (event.key.toLowerCase() === "f") {
        void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose, toggleFullscreen]);

  if (!photo) return null;

  const photoTags = meta.photoTags[photo.id] ?? [];
  const photoPersons = personsOf(photo, meta);
  const extraPersons = meta.photoPersons[photo.id] ?? [];
  const hidden = meta.hidden.includes(photo.id);

  const shownTags = meta.tags.filter((t) =>
    t.toLowerCase().includes(tagSearch.trim().toLowerCase()),
  );
  const shownPersons = allPersons.filter((p) =>
    p.toLowerCase().includes(personSearch.trim().toLowerCase()),
  );
  const searchIsNewPerson =
    personSearch.trim().length > 0 &&
    !allPersons.some((p) => p.toLowerCase() === personSearch.trim().toLowerCase());

  const submitNewTag = () => {
    const name = newTag.trim();
    if (!name) return;
    onAddTag(name);
    if (!photoTags.includes(name)) onToggleTag(name);
    setNewTag("");
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.fileName} bearbeiten`}
    >
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{photoPersons.join(", ")}</p>
          <p className="truncate text-xs text-muted-foreground">
            {photo.series} · {photo.fileName} · {index + 1}/{photos.length}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onToggleHidden} className="gap-1.5">
            {hidden ? <RotateCcw className="size-4" /> : <EyeOff className="size-4" />}
            <span className="hidden sm:inline">{hidden ? "Zurückholen" : "Ausblenden"}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void toggleFullscreen()} aria-label="Vollbild">
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Schließen">
            <X className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted/30 p-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => step(-1)}
            aria-label="Vorheriges Foto"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full"
          >
            <ChevronLeft className="size-5" />
          </Button>

          {url ? (
            <img
              src={url}
              alt={`${photoPersons.join(", ")} aus ${photo.series}`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="size-24 animate-pulse rounded-lg bg-muted" />
          )}

          <Button
            variant="secondary"
            size="icon"
            onClick={() => step(1)}
            aria-label="Nächstes Foto"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-border p-4 lg:w-1/2 lg:max-w-xl lg:border-l lg:border-t-0">
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personen auf diesem Foto
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {photoPersons.map((person) => {
                const removable = extraPersons.includes(person);
                return (
                  <span
                    key={person}
                    className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                  >
                    {person}
                    {removable && (
                      <button
                        type="button"
                        aria-label={`${person} entfernen`}
                        onClick={() => onTogglePerson(person, false)}
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            <div className="relative">
              <UserPlus className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <input
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchIsNewPerson) {
                    onTogglePerson(personSearch.trim(), true);
                    setPersonSearch("");
                  }
                }}
                placeholder="Person suchen oder neu anlegen"
                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground"
              />
            </div>

            {searchIsNewPerson && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-xs"
                onClick={() => {
                  onTogglePerson(personSearch.trim(), true);
                  setPersonSearch("");
                }}
              >
                <Plus className="size-3" /> „{personSearch.trim()}“ hinzufügen
              </Button>
            )}

            <div className="flex flex-wrap gap-1.5">
              {shownPersons
                .filter((p) => !photoPersons.includes(p))
                .map((person) => (
                  <button
                    key={person}
                    type="button"
                    onClick={() => onTogglePerson(person, true)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    + {person}
                  </button>
                ))}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kennzeichen
            </h2>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <input
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Kennzeichen suchen"
                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground"
              />
            </div>

            {meta.tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">Noch keine Kennzeichen angelegt.</p>
            ) : shownTags.length === 0 ? (
              <p className="text-xs text-muted-foreground">Kein Kennzeichen passt zur Suche.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {shownTags.map((tag) => {
                  const on = photoTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleTag(tag)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-accent"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewTag();
                }}
                placeholder="Neues Kennzeichen"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
              <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={submitNewTag}>
                <Plus className="size-3" /> Anlegen
              </Button>
            </div>
          </section>

          <p className="mt-auto text-[11px] text-muted-foreground">
            Pfeiltasten: blättern · F: Vollbild · Esc: schließen · Änderungen werden sofort gespeichert.
          </p>
        </aside>
      </div>
    </div>
  );
}
