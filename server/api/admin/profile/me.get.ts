import type { Octokit } from "@octokit/rest";
import {
	getGitHubTokenCacheKey,
	getOctokit,
	getRepoBranch,
	getRepoOwnerRepo,
} from "../../../utils/github";
import { withRequestCache } from "../../../utils/request-cache";

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
	if (m) return m[1] ?? null;
	if (/^[a-zA-Z0-9_-]+$/.test(s)) return s;
	return null;
}

function parseAuthorFrontmatter(
	raw: string,
): { front: string; body: string; socialGithub?: string } | null {
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
	if (!match) return null;
	const front = match[1] ?? "";
	const body = (match[2] ?? "").trim();
	const ghLine = front.match(/github:\s*(.+)/m);
	let socialGithub: string | undefined;
	if (ghLine) {
		const rawVal = ghLine[1] ?? "";
		socialGithub = rawVal.trim().replace(/^["']|["']$/g, "");
	}
	return { front, body, socialGithub };
}

function parseProfileFromRaw(
	raw: string,
	sha?: string,
): { profile: ProfileMe["profile"]; sha?: string } {
	const parsed = parseAuthorFrontmatter(raw);
	if (!parsed) return { profile: { body: raw }, sha };
	const { front, body } = parsed;
	const social: { github?: string; twitter?: string; website?: string } = {};
	let name: string | undefined;
	let bio: string | undefined;
	let avatar: string | undefined;
	let banner: string | undefined;

	const trimQuotes = (str: string) => str.trim().replace(/^["']|["']$/g, "");

	front.split("\n").forEach((line) => {
		const m = line.match(/^(\w+):\s*(.*)$/);
		if (m) {
			const key = m[1];
			const val = trimQuotes(m[2] ?? "");
			if (key === "name") name = val;
			else if (key === "bio") bio = val;
			else if (key === "avatar") avatar = val;
			else if (key === "banner") banner = val;
		}
	});
	if (front.includes("social:")) {
		const gh = front.match(/github:\s*(.+)/m);
		const tw = front.match(/twitter:\s*(.+)/m);
		const web = front.match(/website:\s*(.+)/m);
		if (gh) social.github = trimQuotes(gh[1] ?? "");
		if (tw) social.twitter = trimQuotes(tw[1] ?? "");
		if (web) social.website = trimQuotes(web[1] ?? "");
	}
	const profile: ProfileMe["profile"] = {
		name,
		bio,
		avatar,
		banner,
		social: Object.keys(social).length ? social : undefined,
		body,
	};
	return { profile, sha };
}

async function resolveAuthorBySocialGithub(
	octokit: Octokit,
	owner: string,
	repo: string,
	branch: string,
	login: string,
	logGitHubError: (stage: string, error: unknown) => void,
) {
	let resolvedPath: string | undefined;
	let profile: ProfileMe["profile"] = null;
	let sha: string | undefined;
	let authorFiles: { name: string; path: string }[] = [];

	try {
		const { data: list } = await octokit.repos.getContent({
			owner,
			repo,
			path: "content/authors",
			ref: branch,
		});
		if (Array.isArray(list)) {
			const mdFiles = list.filter((f: { name: string }) =>
				f.name.endsWith(".md"),
			) as { name: string; path: string }[];
			authorFiles = mdFiles;
			const fileResults = await Promise.all(
				mdFiles.map((f) =>
					octokit.repos
						.getContent({
							owner,
							repo,
							path: f.path,
							ref: branch,
						})
						.catch(() => null),
				),
			);
			for (let i = 0; i < mdFiles.length; i++) {
				const fileMeta = mdFiles[i];
				if (!fileMeta?.path) continue;
				const res = fileResults[i];
				if (
					!res?.data ||
					Array.isArray(res.data) ||
					!("content" in res.data) ||
					!res.data.content
				)
					continue;
				const raw = Buffer.from(res.data.content, "base64").toString(
					"utf-8",
				);
				const parsed = parseAuthorFrontmatter(raw);
				if (!parsed?.socialGithub) continue;
				const fileLogin = githubUrlToLogin(parsed.socialGithub);
				if (
					fileLogin &&
					fileLogin.toLowerCase() === login.toLowerCase()
				) {
					resolvedPath = fileMeta.path;
					const fileSha = (res.data as { sha?: string }).sha;
					const result = parseProfileFromRaw(raw, fileSha);
					profile = result.profile;
					sha = result.sha;
					break;
				}
			}
		}
	} catch (e: unknown) {
		logGitHubError("indexBySocialGithub", e);
	}
	return { resolvedPath, profile, sha, authorFiles };
}

async function resolveAuthorByListing(
	octokit: Octokit,
	owner: string,
	repo: string,
	branch: string,
	login: string,
	logGitHubError: (stage: string, error: unknown) => void,
	existingAuthorFiles: { name: string; path: string }[],
) {
	let authorFiles = existingAuthorFiles;
	let resolvedPath: string | undefined;
	let profile: ProfileMe["profile"] = null;
	let sha: string | undefined;

	if (!authorFiles.length) {
		try {
			const { data: list } = await octokit.repos.getContent({
				owner,
				repo,
				path: "content/authors",
				ref: branch,
			});
			if (Array.isArray(list)) {
				authorFiles = list
					.filter((item: { name: string }) =>
						item.name.endsWith(".md"),
					)
					.map((item: { name: string; path: string }) => ({
						name: item.name,
						path: item.path,
					}));
			}
		} catch (e: unknown) {
			logGitHubError("listAuthorsForFallback", e);
			authorFiles = [];
		}
	}
	const want = `${login}.md`.toLowerCase();
	const matched = authorFiles.find(
		(item) => item.name.toLowerCase() === want,
	);
	if (matched?.path) {
		try {
			const { data: file } = await octokit.repos.getContent({
				owner,
				repo,
				path: matched.path,
				ref: branch,
			});
			if (!Array.isArray(file) && "content" in file && file.content) {
				resolvedPath = matched.path;
				sha = (file as { sha?: string }).sha;
				const raw = Buffer.from(file.content, "base64").toString(
					"utf-8",
				);
				const result = parseProfileFromRaw(raw, sha);
				profile = result.profile;
			}
		} catch (e: unknown) {
			logGitHubError("readMatchedAuthorFile", e);
		}
	}
	return { resolvedPath, profile, sha };
}

export default defineEventHandler(async (event): Promise<ProfileMe | null> => {
	const octokit = getOctokit(event);
	if (!octokit) return null;
	const tokenKey = getGitHubTokenCacheKey(event);
	if (!tokenKey) return null;
	return withRequestCache<ProfileMe | null>(
		`admin-profile-me:${tokenKey}`,
		120 * 1000,
		async () => {
			try {
				const { data: user } = await octokit.users.getAuthenticated();
				const login = user.login;
				const defaultPath = `content/authors/${login.toLowerCase()}.md`;
				const { owner, repo } = getRepoOwnerRepo(event);
				const branch = getRepoBranch(event);

				const logGitHubError = (stage: string, error: unknown) => {
					const err = error as { status?: number; message?: string };
					console.error("[admin/profile/me] GitHub request failed", {
						method: event.method,
						owner,
						repo,
						branch,
						stage,
						githubStatus: err.status,
						githubMessage: err.message,
					});
				};

				// 1) Find author file by social.github matching this GitHub user
				const ghResult = await resolveAuthorBySocialGithub(
					octokit,
					owner,
					repo,
					branch,
					login,
					logGitHubError,
				);
				let resolvedPath = ghResult.resolvedPath;
				let profile = ghResult.profile;
				let sha = ghResult.sha;
				const authorFiles = ghResult.authorFiles;

				// 2) If no match by social.github, use directory listing to resolve file without triggering avoidable 404s.
				if (profile === null) {
					const fallback = await resolveAuthorByListing(
						octokit,
						owner,
						repo,
						branch,
						login,
						logGitHubError,
						authorFiles,
					);
					resolvedPath = fallback.resolvedPath ?? resolvedPath;
					profile = fallback.profile ?? profile;
					sha = fallback.sha ?? sha;
				}

				if (!resolvedPath) {
					resolvedPath = defaultPath;
				}

				let authorId: string | null = null;
				if (resolvedPath) {
					const noPrefix = resolvedPath.replace(
						/^content\/authors\//i,
						"",
					);
					authorId = noPrefix.replace(/\.md$/i, "");
				}

				return {
					login: user.login,
					name: user.name ?? null,
					avatar_url: user.avatar_url,
					authorPath: resolvedPath,
					sha,
					profile,
					authorId,
				};
			} catch (e: unknown) {
				const err = e as { status?: number; message?: string };
				console.error("[admin/profile/me] Failed to resolve profile", {
					method: event.method,
					githubStatus: err.status,
					githubMessage: err.message,
				});
				return null;
			}
		},
	);
});
