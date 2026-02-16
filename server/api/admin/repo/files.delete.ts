import { readBody } from "h3";
import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const body = await readBody<{ path: string; sha: string; message?: string }>(event);
  const { path, sha, message } = body || {};
  if (!path || !sha) {
    throw createError({ statusCode: 400, message: "path and sha are required" });
  }
  const commitMessage = message || `Delete ${path}`;
  try {
    await octokit.repos.deleteFile({ owner, repo, path, sha, message: commitMessage });
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    throw createError({ statusCode: err.status || 500, message: err.message || "Failed to delete file" });
  }
});
