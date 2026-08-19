import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tubi",
    short_name: "Tubi",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F4F5",
    theme_color: "#0D9488",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
