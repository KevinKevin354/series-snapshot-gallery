import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Maximize2,
  Minimize2,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePhotoUrl } from "@/components/PhotoThumb";
import type { Photo } from "@/lib/photo-library";

type Props = {
  photos: Photo[];
  index: number;
  tags: string[];
  photoTags: string[];
  hidden: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onToggleTag: (tag: string) => void;
  onToggleHidden: () => void;
};

export function Lightbox({
  photos,
  index,
  tags,
  photoTags,
  hidden,
  onIndexChange,
  onClose,
  onToggleTag,
  onToggleHidden,
}: Props) {
  const photo = photos[index];
  const url = usePhotoUrl(photo);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      /* Vollbild vom Browser abgelehnt */
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
      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === " ") {
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={photo.fileName}
    >
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{photo.person}</p>
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

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-2">
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
          <img src={url} alt={`${photo.person} aus ${photo.series}`} className="max-h-full max-w-full object-contain" />
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

      <footer className="border-t border-border px-4 py-3">
        {tags.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Noch keine Kennzeichen angelegt – oben unter „Kennzeichen verwalten“.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
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
        <p className="mt-2 text-[11px] text-muted-foreground">
          Pfeiltasten: blättern · F: Vollbild · Esc: schließen
        </p>
      </footer>
    </div>
  );
}
