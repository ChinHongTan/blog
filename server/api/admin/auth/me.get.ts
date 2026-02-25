import { getGitHubTokenCacheKey, getOctokit } from "../../../utils/github";
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
        return { login: data.login, name: data.name, avatar_url: data.avatar_url };
      } catch {
        return null;
      }
    }
  );
});
