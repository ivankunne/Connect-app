// Resolve the canonical site URL for metadata, JSON-LD, robots, and sitemap.
// Order of preference:
//   1. NEXT_PUBLIC_SITE_URL (explicit)
//   2. VERCEL_PROJECT_PRODUCTION_URL (stable production domain on Vercel)
//   3. VERCEL_URL (per-deployment URL on Vercel)
//   4. localhost fallback
// Anything unparseable (e.g. a leftover "<your-app>" placeholder) is ignored
// rather than crashing the build.

function normalize(value?: string | null): string | null {
  if (!value) return null;
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  return (
    normalize(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalize(process.env.VERCEL_URL) ??
    "http://localhost:3000"
  );
}
