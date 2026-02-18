import { getOctokit, getRepoOwnerRepo } from "../../utils/github";

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
  const { owner, repo } = getRepoOwnerRepo(event);

  const [posts, draftPosts, authors, ghDraftsList] = await Promise.all([
    queryCollection(event, "blog")
      .order("date", "DESC")
      .all() as Promise<BlogEntry[]>,
    queryCollection(event, "drafts")
      .order("date", "DESC")
      .all()
      .catch(() => []) as Promise<BlogEntry[]>,
    queryCollection(event, "authors").select("path", "name", "avatar").all() as Promise<AuthorEntry[]>,
    octokit.repos.getContent({ owner, repo, path: "content/drafts" }).catch(() => ({ data: [] as { name: string; path: string }[] })),
  ]);

  const authorDir: Record<string, { name?: string; avatar?: string }> = {};
  for (const a of authors ?? []) {
    const id = getAuthorId(a);
    if (id) authorDir[id] = { name: a.name, avatar: a.avatar };
  }

  function mapPost(post: BlogEntry, repoDir: "blog" | "drafts"): { title: string; author: string; authorDisplayName: string; authorAvatar: string; date: string; path: string; slug: string; draft: boolean } {
    const prefix = repoDir === "blog" ? "blog" : "drafts";
    let stem =
      (post.id as string | undefined)?.replace(/^blog\//, "").replace(/^drafts\//, "").replace(/\.md$/, "") ??
      post.stem ??
      post.path?.replace(/^\/?(?:blog|drafts)\/?/, "").replace(/\/$/, "") ??
      "";
    stem = stem.replace(/^(?:blog\/|drafts\/)+/i, "").trim();
    const repoPath = `content/${prefix}/${stem}.md`;
    const profile = post.author ? authorDir[post.author] : undefined;
    const date = post.date ?? new Date(0).toISOString();
    return {
      title: post.title?.trim() || "(無標題)",
      author: post.author ?? "",
      authorDisplayName: profile?.name ?? post.author ?? "",
      authorAvatar: profile?.avatar ?? (post.author ? fallbackAvatarUrl(post.author) : fallbackAvatarUrl("?")),
      date,
      path: repoPath,
      slug: repoDir === "blog" ? (post.path ?? `/${stem}`) : "",
      draft: repoDir === "drafts" || (post.draft ?? false),
    };
  }

  const blogList = (posts ?? []).map((p) => mapPost(p, "blog"));
  const contentDraftsList = (draftPosts ?? []).map((p) => mapPost(p, "drafts"));
  const contentDraftPaths = new Set(contentDraftsList.map((d) => d.path));

  const ghData = Array.isArray(ghDraftsList?.data) ? ghDraftsList.data : [];
  const ghDraftsListMapped = (ghData as { name: string; path: string }[])
    .filter((f) => f.name.endsWith(".md"))
    .map((f) => {
      const stem = f.name.replace(/\.md$/, "");
      const path = f.path;
      if (contentDraftPaths.has(path)) return null;
      return {
        title: stem || "(草稿)",
        author: "",
        authorDisplayName: "—",
        authorAvatar: fallbackAvatarUrl("?"),
        date: new Date(0).toISOString(),
        path,
        slug: "",
        draft: true,
      };
    })
    .filter(Boolean) as { title: string; author: string; authorDisplayName: string; authorAvatar: string; date: string; path: string; slug: string; draft: boolean }[];

  const list = [...blogList, ...contentDraftsList, ...ghDraftsListMapped].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return list;
});
