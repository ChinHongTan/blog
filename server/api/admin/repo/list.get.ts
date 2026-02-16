import { getQuery } from "h3";
import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const query = getQuery(event);
  const path = (query.path as string) || "content/blog";
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data)) {
      return [];
    }
    return (data as { name: string; path: string; type: string }[])
      .filter((f) => f.name.endsWith(".md"))
      .map((f) => ({ name: f.name, path: f.path, stem: f.name.replace(/\.md$/, "") }));
  } catch (e: unknown) {
    const err = e as { status?: number };
    if (err.status === 404) return [];
    throw createError({ statusCode: err.status || 500, message: "Failed to list" });
  }
});
