import { getRequestURL } from "h3";
import { randomBytes } from "node:crypto";
import { setGitHubToken } from "../../../utils/github";

export default defineEventHandler((event) => {
  if (import.meta.dev) {
    setGitHubToken(event, "mock-dev-token");
    return sendRedirect(event, "/admin");
  }

  const config = useRuntimeConfig(event);
  const clientId = config.public?.githubClientId || config.githubClientId;
  if (!clientId) {
    throw createError({ statusCode: 500, message: "GitHub OAuth not configured" });
  }
  const url = getRequestURL(event);
  const redirectUri = `${url.origin}/api/admin/auth/callback`;
  const scope = "read:user public_repo";
  const state = randomBytes(32).toString("base64url");
  setCookie(event, "gh_oauth_state", state, { httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", maxAge: 600, path: "/" });
  const loginUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  return sendRedirect(event, loginUrl);
});
