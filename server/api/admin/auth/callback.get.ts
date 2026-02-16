import { getRequestURL, getQuery } from "h3";
import { setGitHubToken } from "../../../utils/github";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string;
  const state = query.state as string;
  const storedState = getCookie(event, "gh_oauth_state");
  if (!code || !state || state !== storedState) {
    throw createError({ statusCode: 400, message: "Invalid OAuth callback" });
  }
  const config = useRuntimeConfig(event);
  const clientId = config.public?.githubClientId || config.githubClientId;
  const clientSecret = config.githubClientSecret;
  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, message: "GitHub OAuth not configured" });
  }
  const url = getRequestURL(event);
  const redirectUri = `${url.origin}/api/admin/auth/callback`;
  const res = await $fetch<{ access_token?: string; error?: string }>("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: { client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, state },
  });
  if (res.error || !res.access_token) {
    throw createError({ statusCode: 401, message: res.error || "Failed to get access token" });
  }
  setGitHubToken(event, res.access_token);
  return sendRedirect(event, "/admin");
});
