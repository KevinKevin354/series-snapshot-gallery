import { useEffect, useState } from "react";
import type { Photo } from "@/lib/photo-library";

/** Lädt die Bilddatei erst, wenn die Kachel gerendert wird. */
export function usePhotoUrl(photo: Photo | undefined) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!photo) {
      setUrl(undefined);
      return;
    }
    let objectUrl: string | undefined;
    let cancelled = false;
    photo.handle
      .getFile()
      .then((file) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(undefined));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl(undefined);
    };
  }, [photo]);

  return url;
}

type Props = {
  photo: Photo;
  selected: boolean;
  tagCount: number;
  onOpen: () => void;
  onToggleSelect: (event: React.MouseEvent) => void;
};

export function PhotoThumb({ photo, selected, tagCount, onOpen, onToggleSelect }: Props) {
  const url = usePhotoUrl(photo);

  return (
    <figure className="group relative overflow-hidden rounded-lg bg-muted">
      <button
        type="button"
        onClick={onOpen}
        className="block aspect-square w-full cursor-zoom-in"
        aria-label={`${photo.fileName} groß anzeigen`}
      >
        {url ? (
          <img
            src={url}
            alt={`${photo.person} aus ${photo.series}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="block h-full w-full animate-pulse bg-muted" />
        )}
      </button>

      <button
        type="button"
        onClick={onToggleSelect}
        aria-pressed={selected}
        aria-label="Foto auswählen"
        className={`absolute left-2 top-2 size-5 rounded-md border-2 transition ${
          selected
            ? "border-primary bg-primary"
            : "border-background/80 bg-background/30 opacity-0 group-hover:opacity-100"
        }`}
      />

      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-2 pt-6 text-left opacity-0 transition-opacity group-hover:opacity-100">
        <span className="block truncate text-xs font-medium text-foreground">{photo.person}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {photo.series}
          {tagCount > 0 ? ` · ${tagCount} Kennzeichen` : ""}
        </span>
      </figcaption>

      {selected && <span className="pointer-events-none absolute inset-0 ring-2 ring-primary ring-inset" />}
    </figure>
  );
}
