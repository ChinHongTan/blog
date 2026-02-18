import { getOctokit, getRepoOwnerRepo } from "../../utils/github";

/**
 * Posts index for admin list. Uses only GitHub API (no queryCollection) so it
 * works on Vercel serverless where Nuxt Content's better-sqlite3 native module fails.
 * Fetches file lists and parses frontmatter from GitHub for title/author/date.
 */

type ListItem = { name: string; path: string };

function fallbackAvatarUrl(label: string, size = 40): string {
  const initial = (label?.trim()?.[0] ?? "A").toUpperCase();
  return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${encodeURIComponent(initial)}`;
}

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const front = match[1];
  const out: Record<string, string> = {};
  front.split("\n").forEach((line) => {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      const key = m[1];
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      out[key] = val;
    }
  });
  return out;
}

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);

  const [blogRes, draftsRes, authorsRes] = await Promise.all([
    octokit.repos.getContent({ owner, repo, path: "content/blog" }).catch(() => ({ data: [] })),
    octokit.repos.getContent({ owner, repo, path: "content/drafts" }).catch(() => ({ data: [] })),
    octokit.repos.getContent({ owner, repo, path: "content/authors" }).catch(() => ({ data: [] })),
  ]);

  const blogFiles = (Array.isArray(blogRes.data) ? blogRes.data : []) as ListItem[];
  const draftFiles = (Array.isArray(draftsRes.data) ? draftsRes.data : []) as ListItem[];
  const authorFiles = (Array.isArray(authorsRes.data) ? authorsRes.data : []) as ListItem[];

  const mdBlog = blogFiles.filter((f) => f.name.endsWith(".md"));
  const mdDrafts = draftFiles.filter((f) => f.name.endsWith(".md"));

  const authorDir: Record<string, { name?: string; avatar?: string }> = {};
  await Promise.all(
    authorFiles
      .filter((f) => f.name.endsWith(".md"))
      .map(async (f) => {
        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path: f.path });
          if (Array.isArray(data) || !("content" in data) || !data.content) return;
          const raw = Buffer.from(data.content, "base64").toString("utf-8");
          const fm = parseFrontmatter(raw);
          const id = f.path.replace(/^content\/authors\/?/i, "").replace(/\.md$/i, "").trim();
          if (id) authorDir[id] = { name: fm.name ?? fm.title, avatar: fm.avatar };
        } catch {
          /* ignore */
        }
      })
  );

  type Row = { title: string; author: string; authorDisplayName: string; authorAvatar: string; date: string; path: string; slug: string; draft: boolean };

  async function fetchMeta(path: string): Promise<Record<string, string>> {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (Array.isArray(data) || !("content" in data) || !data.content) return {};
      const raw = Buffer.from(data.content, "base64").toString("utf-8");
      return parseFrontmatter(raw);
    } catch {
      return {};
    }
  }

  const blogRows: Row[] = await Promise.all(
    mdBlog.map(async (f) => {
      const stem = f.name.replace(/\.md$/, "");
      const path = f.path;
      const fm = await fetchMeta(path);
      const author = fm.author ?? "";
      const profile = author ? authorDir[author] : undefined;
      return {
        title: (fm.title ?? "").trim() || stem || "(無標題)",
        author,
        authorDisplayName: profile?.name ?? author ?? "—",
        authorAvatar: profile?.avatar ?? (author ? fallbackAvatarUrl(author) : fallbackAvatarUrl("?")),
        date: fm.date ?? new Date(0).toISOString(),
        path,
        slug: `/${stem}`,
        draft: false,
      };
    })
  );

  const draftRows: Row[] = await Promise.all(
    mdDrafts.map(async (f) => {
      const stem = f.name.replace(/\.md$/, "");
      const path = f.path;
      const fm = await fetchMeta(path);
      const author = fm.author ?? "";
      const profile = author ? authorDir[author] : undefined;
      return {
        title: (fm.title ?? "").trim() || stem || "(草稿)",
        author,
        authorDisplayName: profile?.name ?? author ?? "—",
        authorAvatar: profile?.avatar ?? (author ? fallbackAvatarUrl(author) : fallbackAvatarUrl("?")),
        date: fm.date ?? new Date(0).toISOString(),
        path,
        slug: "",
        draft: true,
      };
    })
  );

  const list = [...blogRows, ...draftRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return list;
});
