import { getQuery } from "h3";
import type { Octokit } from "@octokit/rest";
import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

async function listRecursive(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string
): Promise<{ path: string; name: string }[]> {
  const { data } = await octokit.repos.getContent({ owner, repo, path });
  if (!Array.isArray(data)) return [];
  const out: { path: string; name: string }[] = [];
  for (const f of data as { name: string; path: string; type: string }[]) {
    if (f.type === "dir") {
      const sub = await listRecursive(octokit, owner, repo, f.path);
      out.push(...sub);
    } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.name)) {
      // Nuxt serves public/ at root, so strip "public" prefix for correct img src
      const webPath = "/" + f.path.replace(/^public\/?/, "");
      out.push({ path: webPath, name: f.name });
    }
  }
  return out;
}

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) throw createError({ statusCode: 401, message: "Not authenticated" });
  const { owner, repo } = getRepoOwnerRepo(event);
  const query = getQuery(event);
  const path = (query.path as string) || "public/images";
  try {
    const list = await listRecursive(
      octokit,
      owner,
      repo,
      path.startsWith("/") ? path.slice(1) : path
    );
    return list;
  } catch (e: unknown) {
    const err = e as { status?: number };
    if (err.status === 404) return [];
    throw createError({ statusCode: err.status || 500, message: "Failed to list images" });
  }
});
