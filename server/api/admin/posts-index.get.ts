import { getOctokit } from "../../utils/github";

type BlogEntry = {
  title?: string;
  author?: string;
  date: string;
  path?: string;
  draft?: boolean;
  stem?: string;
  id?: string;
  [key: string]: unknown;
};

type AuthorEntry = {
  path?: string;
  name?: string;
  avatar?: string;
};

function getAuthorId(entry: AuthorEntry): string {
  const p = (entry?.path ?? "").toString().trim();
  const id = p
    .replace(/^content\/authors\/?/i, "")
    .replace(/^\/?authors\/?/i, "")
    .replace(/\.md$/i, "")
    .replace(/\/$/, "")
    .trim();
  return id || (entry?.name ?? "").toString().trim();
}

function fallbackAvatarUrl(label: string, size = 40): string {
  const initial = (label?.trim()?.[0] ?? "A").toUpperCase();
  return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${encodeURIComponent(initial)}`;
}

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });

  const [posts, authors] = await Promise.all([
    queryCollection(event, "blog")
      .order("date", "DESC")
      .all() as Promise<BlogEntry[]>,
    queryCollection(event, "authors").select("path", "name", "avatar").all() as Promise<AuthorEntry[]>,
  ]);

  const authorDir: Record<string, { name?: string; avatar?: string }> = {};
  for (const a of authors ?? []) {
    const id = getAuthorId(a);
    if (id) authorDir[id] = { name: a.name, avatar: a.avatar };
  }

  const list = (posts ?? []).map((post) => {
    let stem =
      (post.id as string | undefined)?.replace(/\.md$/, "") ??
      post.stem ??
      post.path?.replace(/^\/?blog\/?/, "").replace(/\/$/, "") ??
      "";
    // Normalize: strip any leading "blog/" so we never get content/blog/blog/...
    stem = stem.replace(/^(?:blog\/)+/i, "").trim();
    const repoPath = `content/blog/${stem}.md`;
    const profile = post.author ? authorDir[post.author] : undefined;
    return {
      title: post.title?.trim() || "(無標題)",
      author: post.author ?? "",
      authorDisplayName: profile?.name ?? post.author ?? "",
      authorAvatar: profile?.avatar ?? (post.author ? fallbackAvatarUrl(post.author) : fallbackAvatarUrl("?")),
      date: post.date,
      path: repoPath,
      slug: post.path ?? `/${stem}`,
      draft: post.draft ?? false,
    };
  });

  return list;
});
