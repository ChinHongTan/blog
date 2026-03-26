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
	const socialGithub = ghLine
		? (ghLine[1] ?? "").trim().replace(/^["']|["']$/g, "")
		: undefined;
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
	front.split("\n").forEach((line) => {
		const m = line.match(/^(\w+):\s*(.*)$/);
		if (m) {
			const key = m[1];
			const val = (m[2] ?? "").trim().replace(/^["']|["']$/g, "");
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
		if (gh)
			social.github = (gh[1] ?? "").trim().replace(/^["']|["']$/g, "");
		if (tw)
			social.twitter = (tw[1] ?? "").trim().replace(/^["']|["']$/g, "");
		if (web)
			social.website = (web[1] ?? "").trim().replace(/^["']|["']$/g, "");
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

				let resolvedPath: string = defaultPath;
				let profile: ProfileMe["profile"] = null;
				let sha: string | undefined;
				let authorFiles: { name: string; path: string }[] = [];

				// 1) Find author file by social.github matching this GitHub user (fetch all author files in parallel)
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
							const raw = Buffer.from(
								res.data.content,
								"base64",
							).toString("utf-8");
							const parsed = parseAuthorFrontmatter(raw);
							if (!parsed?.socialGithub) continue;
							const fileLogin = githubUrlToLogin(
								parsed.socialGithub,
							);
							if (
								fileLogin &&
								fileLogin.toLowerCase() === login.toLowerCase()
							) {
								resolvedPath = fileMeta.path;
								const fileSha = (res.data as { sha?: string })
									.sha;
								const result = parseProfileFromRaw(
									raw,
									fileSha,
								);
								profile = result.profile;
								sha = result.sha;
								break;
							}
						}
					}
				} catch (e: unknown) {
					logGitHubError("indexBySocialGithub", e);
				}

				// 2) If no match by social.github, use directory listing to resolve file without triggering avoidable 404s.
				if (profile === null) {
					if (!authorFiles.length) {
						try {
							const { data: list } =
								await octokit.repos.getContent({
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
									.map(
										(item: {
											name: string;
											path: string;
										}) => ({
											name: item.name,
											path: item.path,
										}),
									);
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
							const { data: file } =
								await octokit.repos.getContent({
									owner,
									repo,
									path: matched.path,
									ref: branch,
								});
							if (
								!Array.isArray(file) &&
								"content" in file &&
								file.content
							) {
								resolvedPath = matched.path;
								sha = (file as { sha?: string }).sha;
								const raw = Buffer.from(
									file.content,
									"base64",
								).toString("utf-8");
								const result = parseProfileFromRaw(raw, sha);
								profile = result.profile;
							}
						} catch (e: unknown) {
							logGitHubError("readMatchedAuthorFile", e);
						}
					}
				}

				const authorId = resolvedPath
					? resolvedPath
							.replace(/^content\/authors\//i, "")
							.replace(/\.md$/i, "")
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
