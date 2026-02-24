import { readBody } from "h3";
import { extractFrontmatterAuthor, getOctokit, getRepoOwnerRepo, isPostContentPath, resolveCurrentAuthorId, validateAdminPath } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const body = await readBody<{ path: string; sha: string; message?: string }>(event);
  const { path, sha, message } = body || {};
  if (!path || !sha) {
    throw createError({ statusCode: 400, message: "path and sha are required" });
  }
  validateAdminPath(path);
  const commitMessage = message || `Delete ${path}`;
  try {
    if (isPostContentPath(path)) {
      const me = (await resolveCurrentAuthorId(event))?.toLowerCase();
      if (!me) {
        throw createError({ statusCode: 403, message: "Unable to resolve current author identity" });
      }
      const { data: existing } = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(existing) && "content" in existing && existing.content) {
        const raw = Buffer.from(existing.content, "base64").toString("utf-8");
        const ownerAuthor = extractFrontmatterAuthor(raw)?.toLowerCase();
        if (ownerAuthor && ownerAuthor !== me) {
          throw createError({ statusCode: 403, message: "You can only delete your own posts" });
        }
      }
    }
    await octokit.repos.deleteFile({ owner, repo, path, sha, message: commitMessage });
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    throw createError({ statusCode: err.status || 500, message: err.message || "Failed to delete file" });
  }
});
