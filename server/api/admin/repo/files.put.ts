import { readBody } from "h3";
import { extractFrontmatterAuthor, getOctokit, getRepoOwnerRepo, isPostContentPath, resolveCurrentAuthorId, validateAdminPath } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const body = await readBody<{ path: string; content: string; sha?: string; message?: string }>(event);
  const { path, content, sha, message } = body || {};
  if (!path || content === undefined) {
    throw createError({ statusCode: 400, message: "path and content are required" });
  }
  validateAdminPath(path);
  const commitMessage = message || (sha ? `Update ${path}` : `Create ${path}`);
  try {
    if (isPostContentPath(path)) {
      const me = (await resolveCurrentAuthorId(event))?.toLowerCase();
      if (!me) {
        throw createError({ statusCode: 403, message: "Unable to resolve current author identity" });
      }
      const incomingAuthor = extractFrontmatterAuthor(content)?.toLowerCase();
      if (incomingAuthor && incomingAuthor !== me) {
        throw createError({ statusCode: 403, message: "You can only save your own posts" });
      }
      let existingAuthor: string | null = null;
      try {
        const { data: existing } = await octokit.repos.getContent({ owner, repo, path });
        if (!Array.isArray(existing) && "content" in existing && existing.content) {
          const raw = Buffer.from(existing.content, "base64").toString("utf-8");
          existingAuthor = extractFrontmatterAuthor(raw)?.toLowerCase() ?? null;
        }
      } catch {
        // file not found is fine for create flow
      }
      if (existingAuthor && existingAuthor !== me) {
        throw createError({ statusCode: 403, message: "You can only update your own posts" });
      }
      if (!existingAuthor && !incomingAuthor) {
        throw createError({ statusCode: 400, message: "Post frontmatter must include author" });
      }
    }

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
