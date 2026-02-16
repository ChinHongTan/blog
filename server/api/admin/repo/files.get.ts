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
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (Array.isArray(data)) {
      return data.map((f: { name: string; path: string; type: string }) => ({ name: f.name, path: f.path, type: f.type }));
    }
    if ("content" in data && data.content) {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { content, sha: (data as { sha?: string }).sha };
    }
    throw createError({ statusCode: 404, message: "Not found" });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    if (err.status === 404) throw createError({ statusCode: 404, message: "File not found" });
    throw createError({ statusCode: err.status || 500, message: err.message || "Failed to get file" });
  }
});
