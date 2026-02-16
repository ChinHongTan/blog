import { clearGitHubToken } from "../../../utils/github";

export default defineEventHandler((event) => {
  clearGitHubToken(event);
  return { ok: true };
});
