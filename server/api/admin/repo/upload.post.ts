import { readMultipartFormData } from "h3";
import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

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
  const name = file.filename || "image.png";
  const safeName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const path = `${pathPrefix}/${safeName}`;
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
