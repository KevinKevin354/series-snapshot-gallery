import { createFileRoute } from "@tanstack/react-router";
import { GalleryApp } from "@/components/GalleryApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Serien-Fotogalerie – lokale Fotos filtern und kennzeichnen" },
      {
        name: "description",
        content:
          "Lokale Fotogalerie: liest Serien- und Personenordner direkt von der Festplatte, filtert nach Serie, Person und Kennzeichen und speichert alles im Browser.",
      },
      { property: "og:title", content: "Serien-Fotogalerie – lokale Fotos filtern und kennzeichnen" },
      {
        property: "og:description",
        content:
          "Fotos aus eigenen Serien- und Personenordnern anzeigen, kennzeichnen, filtern und ausblenden – ganz ohne Upload.",
      },
    ],
  }),
  component: GalleryApp,
});
