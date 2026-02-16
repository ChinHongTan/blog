import { readBody } from "h3";
import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const body = await readBody<{ path: string; content: string; sha?: string; message?: string }>(event);
  const { path, content, sha, message } = body || {};
  if (!path || content === undefined) {
    throw createError({ statusCode: 400, message: "path and content are required" });
  }
  const commitMessage = message || (sha ? `Update ${path}` : `Create ${path}`);
  try {
    const params: { owner: string; repo: string; path: string; message: string; content: string; sha?: string } = {
      owner,
      repo,
      path,
      message: commitMessage,
      content: Buffer.from(content, "utf-8").toString("base64"),
    };
    if (sha) params.sha = sha;
    const { data } = await octokit.repos.createOrUpdateFileContents(params);
    return { sha: data.content?.sha, url: data.content?.html_url };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    throw createError({ statusCode: err.status || 500, message: err.message || "Failed to save file" });
  }
});
