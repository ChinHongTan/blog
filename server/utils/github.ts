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

export function isPostContentPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, "");
  return normalized.startsWith("content/blog/") || normalized.startsWith("content/drafts/");
}

export function extractFrontmatterAuthor(raw: string): string | null {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const front = match[1];
  const authorMatch = front.match(/^\s*author:\s*(.+)\s*$/m);
  if (!authorMatch) return null;
  const v = authorMatch[1].trim().replace(/^["']|["']$/g, "");
  return v || null;
}

function githubUrlToLogin(url: string): string | null {
  const s = (url || "").trim();
  if (!s) return null;
  const m = s.match(/github\.com\/([^/?#]+)/i);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]+$/.test(s)) return s;
  return null;
}

function extractAuthorGithubLogin(raw: string): string | null {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const front = match[1];
  const ghMatch = front.match(/^\s*github:\s*(.+)\s*$/m);
  if (!ghMatch) return null;
  return githubUrlToLogin(ghMatch[1].trim().replace(/^["']|["']$/g, ""));
}

export async function resolveCurrentAuthorId(event: H3Event): Promise<string | null> {
  const octokit = getOctokit(event);
  if (!octokit) return null;
  const { owner, repo } = getRepoOwnerRepo(event);
  let login: string;
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    login = user.login;
  } catch {
    return null;
  }

  try {
    const { data: list } = await octokit.repos.getContent({ owner, repo, path: "content/authors" });
    if (Array.isArray(list)) {
      const mdFiles = list.filter((f: { name?: string }) => (f.name || "").endsWith(".md")) as { path: string }[];
      for (const f of mdFiles) {
        try {
          const { data: file } = await octokit.repos.getContent({ owner, repo, path: f.path });
          if (Array.isArray(file) || !("content" in file) || !file.content) continue;
          const raw = Buffer.from(file.content, "base64").toString("utf-8");
          const ghLogin = extractAuthorGithubLogin(raw);
          if (ghLogin && ghLogin.toLowerCase() === login.toLowerCase()) {
            return f.path.replace(/^content\/authors\//i, "").replace(/\.md$/i, "");
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }

  const defaultCandidates = [login, login.toLowerCase()];
  for (const candidate of defaultCandidates) {
    try {
      const path = `content/authors/${candidate}.md`;
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(data)) return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}
