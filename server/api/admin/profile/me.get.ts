import { getOctokit, getRepoOwnerRepo } from "../../../utils/github";

/**
 * After GitHub OAuth, we only get an access_token in the callback.
 * We then call GitHub API "Get authenticated user" (users.getAuthenticated).
 * That returns: login, id, avatar_url, name, email (if scope user:email and public),
 * html_url, etc. We use login to map to author frontmatter.
 *
 * Mapping: we find the author .md whose frontmatter links to this GitHub user.
 * - social.github (e.g. https://github.com/ChinHongTan) is matched to user.login (ChinHongTan).
 * - If no match, we use content/authors/{login}.md (create new profile).
 */

export type ProfileMe = {
  login: string;
  name: string | null;
  avatar_url: string;
  authorPath: string | null;
  /** Git blob sha for updating existing file */
  sha?: string;
  /** Parsed frontmatter + body if author file exists */
  profile: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    social?: { github?: string; twitter?: string; website?: string };
    body?: string;
  } | null;
  /** Immutable author ID (filename stem, e.g. chinono from content/authors/chinono.md). Used for post author matching. */
  authorId: string | null;
};

/** Extract GitHub login from social.github URL or plain login. */
function githubUrlToLogin(url: string): string | null {
  const s = (url || "").trim();
  if (!s) return null;
  const m = s.match(/github\.com\/([^/?#]+)/i);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]+$/.test(s)) return s;
  return null;
}

function parseAuthorFrontmatter(raw: string): { front: string; body: string; socialGithub?: string } | null {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return null;
  const front = match[1];
  const body = match[2].trim();
  const ghLine = front.match(/github:\s*(.+)/m);
  const socialGithub = ghLine ? ghLine[1].trim().replace(/^["']|["']$/g, "") : undefined;
  return { front, body, socialGithub };
}

function parseProfileFromRaw(raw: string, sha?: string): { profile: ProfileMe["profile"]; sha?: string } {
  const parsed = parseAuthorFrontmatter(raw);
  if (!parsed) return { profile: { body: raw }, sha };
  const { front, body } = parsed;
  const social: { github?: string; twitter?: string; website?: string } = {};
  let name: string | undefined;
  let email: string | undefined;
  let bio: string | undefined;
  let avatar: string | undefined;
  let banner: string | undefined;
  front.split("\n").forEach((line) => {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      const key = m[1];
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      if (key === "name") name = val;
      else if (key === "email") email = val;
      else if (key === "bio") bio = val;
      else if (key === "avatar") avatar = val;
      else if (key === "banner") banner = val;
    }
  });
  if (front.includes("social:")) {
    const gh = front.match(/github:\s*(.+)/m);
    const tw = front.match(/twitter:\s*(.+)/m);
    const web = front.match(/website:\s*(.+)/m);
    if (gh) social.github = gh[1].trim().replace(/^["']|["']$/g, "");
    if (tw) social.twitter = tw[1].trim().replace(/^["']|["']$/g, "");
    if (web) social.website = web[1].trim().replace(/^["']|["']$/g, "");
  }
  const profile: ProfileMe["profile"] = {
    name,
    email,
    bio,
    avatar,
    banner,
    social: Object.keys(social).length ? social : undefined,
    body,
  };
  return { profile, sha };
}

export default defineEventHandler(async (event): Promise<ProfileMe | null> => {
  const octokit = getOctokit(event);
  if (!octokit) return null;
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    const login = user.login;
    const defaultPath = `content/authors/${login}.md`;
    const { owner, repo } = getRepoOwnerRepo(event);

    let resolvedPath: string = defaultPath;
    let profile: ProfileMe["profile"] = null;
    let sha: string | undefined;

    // 1) Find author file by social.github matching this GitHub user (fetch all author files in parallel)
    try {
      const { data: list } = await octokit.repos.getContent({ owner, repo, path: "content/authors" });
      if (Array.isArray(list)) {
        const mdFiles = list.filter((f: { name: string }) => f.name.endsWith(".md")) as { name: string; path: string }[];
        const fileResults = await Promise.all(
          mdFiles.map((f) => octokit.repos.getContent({ owner, repo, path: f.path }).catch(() => null))
        );
        for (let i = 0; i < mdFiles.length; i++) {
          const res = fileResults[i];
          if (!res?.data || Array.isArray(res.data) || !("content" in res.data) || !res.data.content) continue;
          const raw = Buffer.from(res.data.content, "base64").toString("utf-8");
          const parsed = parseAuthorFrontmatter(raw);
          if (!parsed?.socialGithub) continue;
          const fileLogin = githubUrlToLogin(parsed.socialGithub);
          if (fileLogin && fileLogin.toLowerCase() === login.toLowerCase()) {
            resolvedPath = mdFiles[i].path;
            const fileSha = (res.data as { sha?: string }).sha;
            const result = parseProfileFromRaw(raw, fileSha);
            profile = result.profile;
            sha = result.sha;
            break;
          }
        }
      }
    } catch {
      // ignore list/read errors
    }

    // 2) If no match by social.github, try content/authors/{login}.md (then case-insensitive)
    if (profile === null) {
      const pathsToTry = [
        defaultPath,
        `content/authors/${login.toLowerCase()}.md`,
      ].filter((p, i, a) => a.indexOf(p) === i);
      for (const tryPath of pathsToTry) {
        try {
          const { data } = await octokit.repos.getContent({ owner, repo, path: tryPath });
          if (!Array.isArray(data) && "content" in data && data.content) {
            resolvedPath = tryPath;
            sha = (data as { sha?: string }).sha;
            const raw = Buffer.from(data.content, "base64").toString("utf-8");
            const result = parseProfileFromRaw(raw, sha);
            profile = result.profile;
            break;
          }
        } catch {
          // try next path
        }
      }
      // 2b) If still no match, list files and find case-insensitive match on name
      if (profile === null) {
        try {
          const { data: list } = await octokit.repos.getContent({ owner, repo, path: "content/authors" });
          if (Array.isArray(list)) {
            const want = `${login}.md`.toLowerCase();
            const f = list.find((item: { name: string }) => item.name.toLowerCase() === want);
            if (f && "path" in f) {
              const { data: file } = await octokit.repos.getContent({ owner, repo, path: (f as { path: string }).path });
              if (!Array.isArray(file) && "content" in file && file.content) {
                resolvedPath = (f as { path: string }).path;
                sha = (file as { sha?: string }).sha;
                const raw = Buffer.from(file.content, "base64").toString("utf-8");
                const result = parseProfileFromRaw(raw, sha);
                profile = result.profile;
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }

    const authorId = resolvedPath
      ? resolvedPath.replace(/^content\/authors\//i, "").replace(/\.md$/i, "")
      : null;

    return {
      login: user.login,
      name: user.name ?? null,
      avatar_url: user.avatar_url,
      authorPath: resolvedPath,
      sha,
      profile,
      authorId,
    };
  } catch {
    return null;
  }
});
