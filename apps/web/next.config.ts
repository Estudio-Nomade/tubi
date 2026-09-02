import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  reactStrictMode: true,
  // Allow LAN access (phone/other devices) to HMR and other dev resources.
  // Wildcard for the subnet: the machine's IP changes on DHCP (e.g. .156 → .153),
  // and a stale hardcoded IP makes Next block all JS chunks (403) on the phone,
  // which broke login: no hydration → Continuar "no hace nada".
  allowedDevOrigins: ["192.168.0.*"],
  // Serwist injects webpack config; empty turbopack keeps Next 16 default happy in dev.
  turbopack: {},
});
