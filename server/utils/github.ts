import { Octokit } from "@octokit/rest";
import { getCookie, setCookie, deleteCookie, type H3Event } from "h3";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const COOKIE_NAME = "gh_admin_token";
const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(event: H3Event): Buffer {
  const config = useRuntimeConfig(event);
  const secret = (config.cookieEncryptionSecret as string) || "default-dev-secret-change-in-prod!!";
  const key = Buffer.alloc(32);
  Buffer.from(secret).copy(key);
  return key;
}

function encryptToken(token: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

function decryptToken(payload: string, key: Buffer): string | null {
  try {
    const data = Buffer.from(payload, "base64url");
    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function getGitHubToken(event: H3Event): string | null {
  const cookie = getCookie(event, COOKIE_NAME);
  if (!cookie) return null;
  const key = getEncryptionKey(event);
  return decryptToken(cookie, key);
}

export function setGitHubToken(event: H3Event, token: string) {
  const key = getEncryptionKey(event);
  const encrypted = encryptToken(token, key);
  setCookie(event, COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearGitHubToken(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, { path: "/" });
}

export function getOctokit(event: H3Event): Octokit | null {
  const token = getGitHubToken(event);
  if (!token) return null;
  return new Octokit({ auth: token });
}

export function getRepoOwnerRepo(event: H3Event): { owner: string; repo: string } {
  const config = useRuntimeConfig(event);
  const repo = (config.public?.githubRepo || config.githubRepo || "ChinHongTan/blog") as string;
  const [owner, repoName] = repo.split("/");
  return { owner, repo: repoName || "blog" };
}

const ALLOWED_PATH_PREFIXES = ["content/", "public/images/"];

export function validateAdminPath(path: string): void {
  const normalized = path.replace(/^\/+/, "");
  const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!isAllowed) {
    throw createError({ statusCode: 403, message: `Access denied: path must start with ${ALLOWED_PATH_PREFIXES.join(" or ")}` });
  }
}
