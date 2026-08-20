import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  reactStrictMode: true,
  // Serwist injects webpack config; empty turbopack keeps Next 16 default happy in dev.
  turbopack: {},
});
