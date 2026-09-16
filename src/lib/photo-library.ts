import { get, set } from "idb-keyval";

export type Photo = {
  /** Stabile Id: Serie/Person/Dateiname */
  id: string;
  series: string;
  person: string;
  fileName: string;
  handle: FileSystemFileHandle;
};

export type LibraryMeta = {
  tags: string[];
  photoTags: Record<string, string[]>;
  hidden: string[];
  seen: string[];
};

export const NO_PERSON = "(ohne Person)";

const HANDLE_KEY = "photo-root-handle";
const META_KEY = "photo-meta-v1";

const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?)$/i;

export const emptyMeta = (): LibraryMeta => ({
  tags: [],
  photoTags: {},
  hidden: [],
  seen: [],
});

export function isFileSystemAccessSupported() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export async function loadMeta(): Promise<LibraryMeta> {
  const stored = await get<LibraryMeta>(META_KEY);
  return { ...emptyMeta(), ...(stored ?? {}) };
}

export async function saveMeta(meta: LibraryMeta) {
  await set(META_KEY, meta);
}

export async function loadStoredRoot(): Promise<FileSystemDirectoryHandle | undefined> {
  return get<FileSystemDirectoryHandle>(HANDLE_KEY);
}

export async function storeRoot(handle: FileSystemDirectoryHandle) {
  await set(HANDLE_KEY, handle);
}

export async function pickRoot(): Promise<FileSystemDirectoryHandle> {
  const handle = await (
    window as unknown as {
      showDirectoryPicker: (o?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker({ mode: "read" });
  await storeRoot(handle);
  return handle;
}

type PermissionCapableHandle = FileSystemDirectoryHandle & {
  queryPermission?: (d: { mode: string }) => Promise<PermissionState>;
  requestPermission?: (d: { mode: string }) => Promise<PermissionState>;
};

export async function ensurePermission(
  handle: FileSystemDirectoryHandle,
  interactive: boolean,
): Promise<boolean> {
  const h = handle as PermissionCapableHandle;
  if (!h.queryPermission) return true;
  if ((await h.queryPermission({ mode: "read" })) === "granted") return true;
  if (!interactive || !h.requestPermission) return false;
  return (await h.requestPermission({ mode: "read" })) === "granted";
}

async function* entries(dir: FileSystemDirectoryHandle) {
  const iterable = dir as unknown as {
    values: () => AsyncIterableIterator<FileSystemHandle>;
  };
  for await (const entry of iterable.values()) yield entry;
}

/** Liest Serie/Person/Foto rekursiv aus dem gewählten Ordner. */
export async function scanLibrary(root: FileSystemDirectoryHandle): Promise<Photo[]> {
  const photos: Photo[] = [];

  const collect = (series: string, person: string, fileName: string, handle: FileSystemFileHandle) => {
    photos.push({ id: `${series}/${person}/${fileName}`, series, person, fileName, handle });
  };

  for await (const seriesEntry of entries(root)) {
    if (seriesEntry.kind !== "directory") continue;
    const seriesDir = seriesEntry as FileSystemDirectoryHandle;
    const series = seriesDir.name;

    for await (const inner of entries(seriesDir)) {
      if (inner.kind === "file") {
        if (IMAGE_RE.test(inner.name)) {
          collect(series, NO_PERSON, inner.name, inner as FileSystemFileHandle);
        }
        continue;
      }
      const personDir = inner as FileSystemDirectoryHandle;
      for await (const fileEntry of entries(personDir)) {
        if (fileEntry.kind !== "file" || !IMAGE_RE.test(fileEntry.name)) continue;
        collect(series, personDir.name, fileEntry.name, fileEntry as FileSystemFileHandle);
      }
    }
  }

  photos.sort((a, b) => a.id.localeCompare(b.id, "de"));
  return photos;
}
