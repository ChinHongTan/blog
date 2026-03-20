import { getGitHubTokenCacheKey, getOctokit, getRepoOwnerRepo, hasRepoWriteAccess } from "../../../utils/github";
import { withRequestCache } from "../../../utils/request-cache";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) {
    return null;
  }
  const tokenKey = getGitHubTokenCacheKey(event);
  if (!tokenKey) return null;
  return withRequestCache(
    `admin-auth-me:${tokenKey}`,
    20 * 1000,
    async () => {
      try {
        const { data } = await octokit.users.getAuthenticated();
        const { owner, repo } = getRepoOwnerRepo(event);
        const canWrite = await hasRepoWriteAccess(octokit, owner, repo);
        if (!canWrite) {
          throw createError({ statusCode: 403, message: "You do not have write access to this repository" });
        }
        return { login: data.login, name: data.name, avatar_url: data.avatar_url };
      } catch (e: unknown) {
        const err = e as { statusCode?: number; status?: number };
        if (err.statusCode === 403 || err.status === 403) {
          throw e;
        }
        return null;
      }
    }
  );
});
