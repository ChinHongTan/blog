import { readBody } from "h3";
import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const body = await readBody<{ fromPath: string; toPath: string; message?: string }>(event);
  const { fromPath, toPath, message } = body || {};
  if (!fromPath || !toPath) {
    throw createError({ statusCode: 400, message: "fromPath and toPath are required" });
  }
  const commitMessage = message || `Move ${fromPath} to ${toPath}`;
  try {
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path: fromPath });
    if (Array.isArray(fileData) || !("content" in fileData) || !fileData.content) {
      throw createError({ statusCode: 404, message: "Source file not found" });
    }
    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const fromSha = (fileData as { sha?: string }).sha;
    let toSha: string | undefined;
    try {
      const { data: existing } = await octokit.repos.getContent({ owner, repo, path: toPath });
      if (!Array.isArray(existing) && existing && "sha" in existing) {
        toSha = (existing as { sha?: string }).sha;
      }
    } catch {
      // toPath does not exist; we will create
    }
    const { data: createData } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: toPath,
      message: commitMessage,
      content: Buffer.from(content, "utf-8").toString("base64"),
      ...(toSha ? { sha: toSha } : {}),
    });
    await octokit.repos.deleteFile({
      owner,
      repo,
      path: fromPath,
      sha: fromSha,
      message: `Remove ${fromPath} (moved to ${toPath})`,
    });
    return { sha: createData.content?.sha, ok: true };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    if (err.status === 404) throw e;
    throw createError({ statusCode: err.status || 500, message: err.message || "Failed to move file" });
  }
});
