import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: "content/authors" });
    if (!Array.isArray(data)) {
      return [];
    }
    const authors = data
      .filter((f: { name: string }) => f.name.endsWith(".md"))
      .map((f: { name: string; path: string }) => ({
        name: f.name.replace(/\.md$/, ""),
        path: f.path,
      }));
    const withMeta = await Promise.all(
      authors.map(async (a: { name: string; path: string }) => {
        try {
          const { data: file } = await octokit.repos.getContent({ owner, repo, path: a.path });
          if (Array.isArray(file) || !("content" in file) || !file.content) return { ...a, displayName: a.name };
          const text = Buffer.from(file.content, "base64").toString("utf-8");
          const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
          const front = match ? match[1] : "";
          const nameLine = front.split("\n").find((l) => l.startsWith("name:"));
          const displayName = nameLine ? nameLine.replace(/name:\s*/, "").trim().replace(/^["']|["']$/g, "") : a.name;
          return { ...a, displayName };
        } catch {
          return { ...a, displayName: a.name };
        }
      })
    );
    return withMeta;
  } catch (e: unknown) {
    const err = e as { status?: number };
    if (err.status === 404) return [];
    throw createError({ statusCode: err.status || 500, message: "Failed to list authors" });
  }
});
