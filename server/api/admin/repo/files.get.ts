import { getQuery } from "h3";
import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const query = getQuery(event);
  const path = (query.path as string) || "";
  if (!path) {
    throw createError({ statusCode: 400, message: "path is required" });
  }
  try {
    const [contentResponse, commitsResponse] = await Promise.all([
      octokit.repos.getContent({ owner, repo, path }),
      octokit.repos.listCommits({ owner, repo, path }).catch(() => ({ data: [] as { commit?: { author?: { date?: string } } }[] })),
    ]);
    const { data } = contentResponse;
    if (Array.isArray(data)) {
      return data.map((f: { name: string; path: string; type: string }) => ({ name: f.name, path: f.path, type: f.type }));
    }
    if ("content" in data && data.content) {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      const sha = (data as { sha?: string }).sha;
      const commits = commitsResponse.data;
      const lastModified =
        commits?.length && commits[0].commit?.author?.date ? commits[0].commit.author.date : undefined;
      return { content, sha, lastModified };
    }
    throw createError({ statusCode: 404, message: "Not found" });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    if (err.status === 404) throw createError({ statusCode: 404, message: "File not found" });
    throw createError({ statusCode: err.status || 500, message: err.message || "Failed to get file" });
  }
});
