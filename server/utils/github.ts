import { Octokit } from "@octokit/rest";
import { getCookie, setCookie, deleteCookie, type H3Event } from "h3";

const COOKIE_NAME = "gh_admin_token";

export function getGitHubToken(event: H3Event): string | null {
  const token = getCookie(event, COOKIE_NAME);
  return token || null;
}

export function setGitHubToken(event: H3Event, token: string) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export function clearGitHubToken(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, { path: "/" });
}

export function getOctokit(event: H3Event): Octokit | null {
  const token = getGitHubToken(event);
  useRuntimeConfig(event);
  if (!token) return null;
  return new Octokit({ auth: token });
}

export function getRepoOwnerRepo(event: H3Event): { owner: string; repo: string } {
  const config = useRuntimeConfig(event);
  const repo = (config.public?.githubRepo || config.githubRepo || "ChinHongTan/blog") as string;
  const [owner, repoName] = repo.split("/");
  return { owner, repo: repoName || "blog" };
}
