import { getOctokit } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const octokit = getOctokit(event);
  if (!octokit) {
    return null;
  }
  try {
    const { data } = await octokit.users.getAuthenticated();
    return { login: data.login, name: data.name, avatar_url: data.avatar_url };
  } catch {
    return null;
  }
});
