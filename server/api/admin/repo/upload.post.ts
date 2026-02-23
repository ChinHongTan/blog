import { readMultipartFormData } from "h3";
import { getOctokit, getRepoOwnerRepo, validateAdminPath } from "../../../utils/github";

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const form = await readMultipartFormData(event);
  const file = form?.find((f) => f.name === "file" && f.data);
  const pathPrefix = form?.find((f) => f.name === "pathPrefix")?.data?.toString() || "public/images/uploads";
  if (!file?.data) {
    throw createError({ statusCode: 400, message: "No file uploaded" });
  }
  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, message: "File too large (max 5MB)" });
  }
  const name = file.filename || "image.png";
  const ext = name.includes(".") ? `.${name.split(".").pop()!.toLowerCase()}` : "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw createError({ statusCode: 400, message: `File type not allowed. Accepted: ${[...ALLOWED_EXTENSIONS].join(", ")}` });
  }
  const safeName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const path = `${pathPrefix}/${safeName}`;
  validateAdminPath(path);
  const content = Buffer.from(file.data).toString("base64");
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Upload image: ${safeName}`,
      content,
    });
    // Nuxt serves public/ at root; return path without "public" for correct img src
    const webPath = "/" + path.replace(/^public\/?/, "");
    return { path: webPath, url: webPath };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    throw createError({ statusCode: err.status || 500, message: err.message || "Upload failed" });
  }
});
