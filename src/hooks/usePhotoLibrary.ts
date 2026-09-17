import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyMeta,
  ensurePermission,
  loadMeta,
  loadStoredRoot,
  pickRoot,
  saveMeta,
  scanLibrary,
  type LibraryMeta,
  type Photo,
} from "@/lib/photo-library";

export type LibraryStatus = "init" | "no-folder" | "needs-permission" | "scanning" | "ready" | "error";

export function usePhotoLibrary() {
  const [status, setStatus] = useState<LibraryStatus>("init");
  const [error, setError] = useState<string>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [meta, setMeta] = useState<LibraryMeta>(emptyMeta());
  const [rootName, setRootName] = useState<string>();
  /** Ids, die beim Start neu waren – bleibt während der Sitzung stabil. */
  const [newIds, setNewIds] = useState<string[]>([]);
  const rootRef = useRef<FileSystemDirectoryHandle | undefined>(undefined);
  const metaLoaded = useRef(false);

  const persist = useCallback((next: LibraryMeta) => {
    setMeta(next);
    void saveMeta(next);
  }, []);

  const scan = useCallback(async (root: FileSystemDirectoryHandle, markNew: boolean) => {
    setStatus("scanning");
    try {
      const found = await scanLibrary(root);
      setPhotos(found);
      setRootName(root.name);
      const current = await loadMeta();
      const seen = new Set(current.seen);
      const fresh = found.filter((p) => !seen.has(p.id)).map((p) => p.id);
      if (markNew) setNewIds(fresh);
      const next = { ...current, seen: found.map((p) => p.id) };
      setMeta(next);
      await saveMeta(next);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ordner konnte nicht gelesen werden.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (metaLoaded.current) return;
    metaLoaded.current = true;
    void (async () => {
      const stored = await loadMeta();
      setMeta(stored);
      const root = await loadStoredRoot();
      if (!root) {
        setStatus("no-folder");
        return;
      }
      rootRef.current = root;
      setRootName(root.name);
      if (await ensurePermission(root, false)) await scan(root, true);
      else setStatus("needs-permission");
    })();
  }, [scan]);

  const chooseFolder = useCallback(async () => {
    try {
      const root = await pickRoot();
      rootRef.current = root;
      await scan(root, true);
    } catch {
      // Auswahl abgebrochen
    }
  }, [scan]);

  const grantPermission = useCallback(async () => {
    const root = rootRef.current;
    if (!root) return;
    if (await ensurePermission(root, true)) await scan(root, true);
  }, [scan]);

  const rescan = useCallback(async () => {
    const root = rootRef.current;
    if (!root) return;
    if (await ensurePermission(root, true)) await scan(root, true);
  }, [scan]);

  const addTag = useCallback(
    (name: string) => {
      const tag = name.trim();
      if (!tag || meta.tags.includes(tag)) return;
      persist({ ...meta, tags: [...meta.tags, tag] });
    },
    [meta, persist],
  );

  const renameTag = useCallback(
    (from: string, to: string) => {
      const target = to.trim();
      if (!target || target === from || meta.tags.includes(target)) return;
      const photoTags: Record<string, string[]> = {};
      for (const [id, list] of Object.entries(meta.photoTags)) {
        photoTags[id] = list.map((t) => (t === from ? target : t));
      }
      persist({ ...meta, tags: meta.tags.map((t) => (t === from ? target : t)), photoTags });
    },
    [meta, persist],
  );

  const deleteTag = useCallback(
    (tag: string) => {
      const photoTags: Record<string, string[]> = {};
      for (const [id, list] of Object.entries(meta.photoTags)) {
        const kept = list.filter((t) => t !== tag);
        if (kept.length > 0) photoTags[id] = kept;
      }
      persist({ ...meta, tags: meta.tags.filter((t) => t !== tag), photoTags });
    },
    [meta, persist],
  );

  const setPhotoTag = useCallback(
    (ids: string[], tag: string, on: boolean) => {
      const photoTags = { ...meta.photoTags };
      for (const id of ids) {
        const list = photoTags[id] ?? [];
        if (on) {
          if (!list.includes(tag)) photoTags[id] = [...list, tag];
        } else {
          const kept = list.filter((t) => t !== tag);
          if (kept.length > 0) photoTags[id] = kept;
          else delete photoTags[id];
        }
      }
      persist({ ...meta, photoTags });
    },
    [meta, persist],
  );

  const setHidden = useCallback(
    (ids: string[], hide: boolean) => {
      const hidden = new Set(meta.hidden);
      for (const id of ids) {
        if (hide) hidden.add(id);
        else hidden.delete(id);
      }
      persist({ ...meta, hidden: [...hidden] });
    },
    [meta, persist],
  );

  return {
    status,
    error,
    photos,
    meta,
    rootName,
    newIds,
    chooseFolder,
    grantPermission,
    rescan,
    addTag,
    renameTag,
    deleteTag,
    setPhotoTag,
    setHidden,
  };
}
