import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: process.env.NEXT_PUBLIC_PROPERTY_NAME ?? "Hotel Manager",
    short_name: process.env.NEXT_PUBLIC_PROPERTY_NAME ?? "Hotel",
    description: "Διαχείριση έξυπνου ακινήτου",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "hsl(33, 18%, 91%)",  // --canvas
    theme_color: "hsl(198, 72%, 24%)",       // --aegean
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
