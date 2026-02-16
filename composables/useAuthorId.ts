/**
 * Immutable author ID = filename stem (e.g. chinono from content/authors/chinono.md).
 * Nuxt Content exposes path as "/authors/chinono" or "authors/chinono".
 */
export function getAuthorId(entry: { path?: string; _path?: string; name?: string }): string {
  const p = (entry?.path ?? entry?._path ?? "").toString().trim();
  const id = p
    .replace(/^content\/authors\/?/i, "")
    .replace(/^\/?authors\/?/i, "")
    .replace(/\.md$/i, "")
    .replace(/\/$/, "")
    .trim();
  return id || (entry?.name ?? "").toString().trim();
}
