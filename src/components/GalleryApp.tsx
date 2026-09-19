import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  FolderOpen,
  Images,
  Lock,
  Pencil,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoThumb } from "@/components/PhotoThumb";
import { Lightbox } from "@/components/Lightbox";
import { PhotoEditor } from "@/components/PhotoEditor";
import { PasswordGate, GateCard } from "@/components/PasswordGate";
import {
  FilterGroup,
  emptyFilter,
  matchesFilter,
  type FilterState,
} from "@/components/FilterBar";
import { isFileSystemAccessSupported, personsOf } from "@/lib/photo-library";
import { clearSessionUnlocked } from "@/lib/password-gate";
import { usePhotoLibrary } from "@/hooks/usePhotoLibrary";

type View = "alle" | "neu" | "ohne" | "ausgeblendet";

const PAGE_SIZE = 300;

export function GalleryApp() {
  return (
    <PasswordGate>
      <GalleryPage />
    </PasswordGate>
  );
}

function GalleryPage() {
  const lib = usePhotoLibrary();
  const [seriesFilter, setSeriesFilter] = useState<FilterState>(emptyFilter());
  const [personFilter, setPersonFilter] = useState<FilterState>(emptyFilter());
  const [tagFilter, setTagFilter] = useState<FilterState>(emptyFilter());
  const [view, setView] = useState<View>("alle");
  const [selection, setSelection] = useState<string[]>([]);
  const [openIndex, setOpenIndex] = useState<number>();
  const [editMode, setEditMode] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { photos, meta, newIds } = lib;
  const hiddenSet = useMemo(() => new Set(meta.hidden), [meta.hidden]);
  const newSet = useMemo(() => new Set(newIds), [newIds]);

  const allSeries = useMemo(
    () => [...new Set(photos.map((p) => p.series))].sort((a, b) => a.localeCompare(b, "de")),
    [photos],
  );

  /** Alle Personen (Ordner + selbst angelegte), für Filter und Bearbeitung. */
  const allPersons = useMemo(() => {
    const set = new Set<string>(meta.extraPersons);
    for (const p of photos) for (const person of personsOf(p, meta)) set.add(person);
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [photos, meta]);

  const persons = useMemo(() => {
    const relevant = photos.filter(
      (p) =>
        (seriesFilter.include.length === 0 || seriesFilter.include.includes(p.series)) &&
        !seriesFilter.exclude.includes(p.series),
    );
    const set = new Set<string>();
    for (const p of relevant) for (const person of personsOf(p, meta)) set.add(person);
    for (const person of meta.extraPersons) set.add(person);
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [photos, seriesFilter, meta]);

  const visible = useMemo(() => {
    return photos.filter((p) => {
      const tags = meta.photoTags[p.id] ?? [];
      if (view === "ausgeblendet") {
        if (!hiddenSet.has(p.id)) return false;
      } else {
        if (hiddenSet.has(p.id)) return false;
        if (view === "neu" && !newSet.has(p.id)) return false;
        if (view === "ohne" && tags.length > 0) return false;
      }
      if (!matchesFilter(seriesFilter, [p.series])) return false;
      if (!matchesFilter(personFilter, personsOf(p, meta))) return false;
      if (!matchesFilter(tagFilter, tags)) return false;
      return true;
    });
  }, [photos, meta, view, hiddenSet, newSet, seriesFilter, personFilter, tagFilter]);

  const counts = useMemo(() => {
    const active = photos.filter((p) => !hiddenSet.has(p.id));
    return {
      alle: active.length,
      neu: active.filter((p) => newSet.has(p.id)).length,
      ohne: active.filter((p) => (meta.photoTags[p.id] ?? []).length === 0).length,
      ausgeblendet: meta.hidden.length,
    };
  }, [photos, hiddenSet, newSet, meta.photoTags, meta.hidden.length]);

  const tagUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    for (const list of Object.values(meta.photoTags)) {
      for (const tag of list) usage[tag] = (usage[tag] ?? 0) + 1;
    }
    return usage;
  }, [meta.photoTags]);

  const resetFilters = () => {
    setSeriesFilter(emptyFilter());
    setPersonFilter(emptyFilter());
    setTagFilter(emptyFilter());
  };

  const toggleSelect = (id: string) =>
    setSelection((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const lockApp = () => {
    clearSessionUnlocked();
    window.location.reload();
  };

  if (!isFileSystemAccessSupported() && lib.status !== "init") {
    return (
      <GateCard title="Browser nicht unterstützt">
        <p className="text-sm text-muted-foreground">
          Diese Galerie liest Ordner direkt von Ihrer Festplatte. Das funktioniert in Chrome oder Edge.
        </p>
      </GateCard>
    );
  }

  if (lib.status === "init" || lib.status === "scanning") {
    return (
      <GateCard title={lib.status === "scanning" ? "Fotos werden eingelesen …" : "Wird geladen …"}>
        <RefreshCw className="mx-auto size-6 animate-spin text-muted-foreground" />
      </GateCard>
    );
  }

  if (lib.status === "no-folder" || lib.status === "error") {
    return (
      <GateCard title="Fotoordner auswählen">
        <p className="text-sm text-muted-foreground">
          Wählen Sie den Ordner, in dem Ihre Serien liegen. Struktur: Serie → Person → Fotos. Die Dateien
          bleiben auf Ihrem Rechner.
        </p>
        {lib.error && <p className="text-sm text-destructive">{lib.error}</p>}
        <Button onClick={() => void lib.chooseFolder()} className="gap-2">
          <FolderOpen className="size-4" /> Ordner auswählen
        </Button>
      </GateCard>
    );
  }

  if (lib.status === "needs-permission") {
    return (
      <GateCard title="Zugriff bestätigen">
        <p className="text-sm text-muted-foreground">
          Der Ordner „{lib.rootName}“ ist gespeichert. Bitte den Zugriff für diese Sitzung erlauben.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => void lib.grantPermission()}>Zugriff erlauben</Button>
          <Button variant="outline" onClick={() => void lib.chooseFolder()}>
            Anderer Ordner
          </Button>
        </div>
      </GateCard>
    );
  }

  const current = openIndex !== undefined ? visible[openIndex] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Images className="size-5 text-primary" />
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground">Fotogalerie</h1>
              <p className="text-xs text-muted-foreground">
                {lib.rootName} · {photos.length} Fotos · {allSeries.length} Serien
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setEditMode((on) => !on)}
            >
              <Pencil className="size-4" />
              Bearbeitungsmodus {editMode ? "an" : "aus"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void lib.rescan()}>
              <RefreshCw className="size-4" /> Neu einlesen
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void lib.chooseFolder()}>
              <FolderOpen className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Sperren" onClick={lockApp}>
              <Lock className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-3">
          {(
            [
              ["alle", "Alle Fotos", counts.alle],
              ["neu", "Neu gefunden", counts.neu],
              ["ohne", "Ohne Kennzeichen", counts.ohne],
              ["ausgeblendet", "Ausgeblendet", counts.ausgeblendet],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setView(key);
                setLimit(PAGE_SIZE);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {key === "neu" && <Sparkles className="mr-1 inline size-3" />}
              {label} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-5">
        {editMode && (
          <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs text-foreground">
            Bearbeitungsmodus ist an: Ein Klick auf ein Foto öffnet es groß mit der Bearbeitungsspalte für
            Kennzeichen und Personen.
          </p>
        )}

        <div className="grid gap-5 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
          <FilterGroup
            title="Serien"
            values={allSeries}
            filter={seriesFilter}
            onChange={setSeriesFilter}
            emptyHint="Keine Serienordner gefunden."
          />
          <FilterGroup
            title="Personen"
            values={persons}
            filter={personFilter}
            onChange={setPersonFilter}
            emptyHint="Keine Personen gefunden."
          />
          <FilterGroup
            title="Kennzeichen"
            values={meta.tags}
            counts={tagUsage}
            filter={tagFilter}
            onChange={setTagFilter}
            emptyHint="Noch keine Kennzeichen angelegt."
          />
          <p className="text-xs text-muted-foreground md:col-span-3">
            Klick: muss zutreffen (mehrere Auswahlen gelten gleichzeitig) · Doppelklick: ausschließen.
            <Button variant="link" size="sm" className="h-auto px-2 py-0 text-xs" onClick={resetFilters}>
              Alle Filter zurücksetzen
            </Button>
          </p>
        </div>

        {selection.length > 0 && (
          <div className="sticky top-[7.5rem] z-20 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
            <span className="text-sm font-medium">{selection.length} ausgewählt</span>
            {meta.tags.map((tag) => (
              <Button
                key={tag}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => lib.setPhotoTag(selection, tag, true)}
              >
                + {tag}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 gap-1 text-xs"
              onClick={() => {
                lib.setHidden(selection, view !== "ausgeblendet");
                setSelection([]);
              }}
            >
              {view === "ausgeblendet" ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              {view === "ausgeblendet" ? "Zurückholen" : "Ausblenden"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelection([])}>
              <X className="size-3" /> Auswahl leeren
            </Button>
          </div>
        )}

        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Keine Fotos für diese Auswahl.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {visible.slice(0, limit).map((photo, index) => (
                <PhotoThumb
                  key={photo.id}
                  photo={photo}
                  selected={selection.includes(photo.id)}
                  tagCount={(meta.photoTags[photo.id] ?? []).length}
                  onOpen={() => setOpenIndex(index)}
                  onToggleSelect={(event) => {
                    event.stopPropagation();
                    toggleSelect(photo.id);
                  }}
                />
              ))}
            </div>
            {visible.length > limit && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                  Weitere {Math.min(PAGE_SIZE, visible.length - limit)} Fotos laden
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {openIndex !== undefined && current && !editMode && (
        <Lightbox
          photos={visible}
          index={openIndex}
          tags={meta.tags}
          photoTags={meta.photoTags[current.id] ?? []}
          hidden={hiddenSet.has(current.id)}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(undefined)}
          onToggleTag={(tag) => {
            const on = (meta.photoTags[current.id] ?? []).includes(tag);
            lib.setPhotoTag([current.id], tag, !on);
          }}
          onToggleHidden={() => lib.setHidden([current.id], !hiddenSet.has(current.id))}
        />
      )}

      {openIndex !== undefined && current && editMode && (
        <PhotoEditor
          photos={visible}
          index={openIndex}
          meta={meta}
          allPersons={allPersons}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(undefined)}
          onToggleTag={(tag) => {
            const on = (meta.photoTags[current.id] ?? []).includes(tag);
            lib.setPhotoTag([current.id], tag, !on);
          }}
          onAddTag={lib.addTag}
          onTogglePerson={(person, on) => lib.setPhotoPerson([current.id], person, on)}
          onToggleHidden={() => lib.setHidden([current.id], !hiddenSet.has(current.id))}
        />
      )}
    </div>
  );
}
