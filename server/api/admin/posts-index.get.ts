import {
	getOctokit,
	getRepoOwnerRepo,
	getGitHubTokenCacheKey,
} from "../../utils/github";
import { withRequestCache } from "../../utils/request-cache";

/**
 * Posts index for admin list. Uses Git Trees API to fetch all content in a
 * single call, then fetches file contents in parallel batches to avoid N+1.
 * Results are cached for 2 minutes per user token.
 */

function fallbackAvatarUrl(label: string, size = 40): string {
	const initial = (label?.trim()?.[0] ?? "A").toUpperCase();
	return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${encodeURIComponent(initial)}`;
}

function parseFrontmatter(raw: string): Record<string, string | string[]> {
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!match) return {};
	const front = match[1] ?? "";
	const out: Record<string, string | string[]> = {};
	const lines = front.split("\n");
	let currentKey: string | null = null;
	let arrayValues: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Check for array item (starts with "  - ")
		const arrayMatch = line.match(/^\s{2}-\s+(.*)$/);
		if (arrayMatch && currentKey) {
			arrayValues.push(arrayMatch[1].trim().replace(/^["']|["']$/g, ""));
			continue;
		}
		// If we were building an array, save it
		if (currentKey && arrayValues.length > 0) {
			out[currentKey] = arrayValues;
			arrayValues = [];
			currentKey = null;
		}
		// Check for key: value
		const m = line.match(/^(\w+):\s*(.*)$/);
		if (m) {
			const key = m[1];
			const value = (m[2] ?? "").trim().replace(/^["']|["']$/g, "");
			if (key) {
				if (value === "") {
					// Might be an array, wait for next lines
					currentKey = key;
				} else {
					out[key] = value;
				}
			}
		}
	}
	// Handle trailing array
	if (currentKey && arrayValues.length > 0) {
		out[currentKey] = arrayValues;
	}
	return out;
}

async function fetchBlobContent(
	octokit: ReturnType<typeof getOctokit>,
	owner: string,
	repo: string,
	sha: string,
): Promise<string> {
	const { data } = await octokit!.git.getBlob({ owner, repo, file_sha: sha });
	return Buffer.from(data.content, "base64").toString("utf-8");
}

type Row = {
	title: string;
	author: string;
	authorDisplayName: string;
	authorAvatar: string;
	date: string;
	path: string;
	slug: string;
	draft: boolean;
	series: string[];
};
type PostsIndexResponse = { posts: Row[]; series: string[] };

export default defineEventHandler(async (event) => {
	const octokit = getOctokit(event);
	if (!octokit)
		throw createError({ statusCode: 401, message: "Not authenticated" });
	const { owner, repo } = getRepoOwnerRepo(event);
	const tokenKey = getGitHubTokenCacheKey(event) ?? "anon";

	// Cache for 2 minutes per user
	const cacheKey = `posts-index:${tokenKey}`;
	return withRequestCache<PostsIndexResponse>(cacheKey, 120_000, async () => {
		// Single API call: fetch the entire repo tree
		const { data: refData } = await octokit.git
			.getRef({ owner, repo, ref: "heads/main" })
			.catch(() =>
				octokit.git.getRef({ owner, repo, ref: "heads/master" }),
			);
		const treeSha = refData.object.sha;
		const { data: treeData } = await octokit.git.getTree({
			owner,
			repo,
			tree_sha: treeSha,
			recursive: "1",
		});

		const contentFiles = treeData.tree.filter(
			(item) => item.type === "blob" && item.path?.endsWith(".md"),
		);

		const blogFiles = contentFiles.filter((f) =>
			f.path?.startsWith("content/blog/"),
		);
		const draftFiles = contentFiles.filter((f) =>
			f.path?.startsWith("content/drafts/"),
		);
		const authorFiles = contentFiles.filter((f) =>
			f.path?.startsWith("content/authors/"),
		);

		// Fetch all file contents in parallel using blob SHAs (much faster than getContent)
		const authorDir: Record<string, { name?: string; avatar?: string }> =
			{};
		await Promise.all(
			authorFiles.map(async (f) => {
				if (!f.sha || !f.path) return;
				try {
					const raw = await fetchBlobContent(
						octokit,
						owner,
						repo,
						f.sha,
					);
					const fm = parseFrontmatter(raw);
					const id = f.path
						.replace(/^content\/authors\/?/i, "")
						.replace(/\.md$/i, "")
						.trim();
					const name = fm.name ?? fm.title;
					if (id)
						authorDir[id] = {
							name: typeof name === "string" ? name : undefined,
							avatar:
								typeof fm.avatar === "string"
									? fm.avatar
									: undefined,
						};
				} catch {
					/* ignore */
				}
			}),
		);

		// Collect all series names
		const allSeries = new Set<string>();

		function toRow(
			f: { path?: string; sha?: string | null },
			fm: Record<string, string | string[]>,
			isDraft: boolean,
		): Row {
			const path = f.path!;
			const stem = path.split("/").pop()?.replace(/\.md$/, "") ?? "";
			const author = typeof fm.author === "string" ? fm.author : "";
			const profile = author ? authorDir[author] : undefined;

			// Collect series
			const series = fm.series;
			if (Array.isArray(series)) {
				series.forEach((s) => allSeries.add(s));
			} else if (typeof series === "string" && series) {
				allSeries.add(series);
			}

			return {
				title:
					(typeof fm.title === "string" ? fm.title : "").trim() ||
					stem ||
					(isDraft ? "(草稿)" : "(無標題)"),
				author,
				authorDisplayName: profile?.name ?? author ?? "—",
				authorAvatar:
					profile?.avatar ??
					(author
						? fallbackAvatarUrl(author)
						: fallbackAvatarUrl("?")),
				date:
					typeof fm.date === "string"
						? fm.date
						: new Date(0).toISOString(),
				path,
				slug: isDraft ? "" : `/${stem}`,
				draft: isDraft,
				series: Array.isArray(series)
					? series.filter((s) => typeof s === "string" && s.trim())
					: typeof series === "string" && series.trim()
						? [series]
						: [],
			};
		}

		const [blogRows, draftRows] = await Promise.all([
			Promise.all(
				blogFiles.map(async (f) => {
					if (!f.sha) return null;
					try {
						const raw = await fetchBlobContent(
							octokit,
							owner,
							repo,
							f.sha,
						);
						return toRow(f, parseFrontmatter(raw), false);
					} catch {
						return null;
					}
				}),
			),
			Promise.all(
				draftFiles.map(async (f) => {
					if (!f.sha) return null;
					try {
						const raw = await fetchBlobContent(
							octokit,
							owner,
							repo,
							f.sha,
						);
						return toRow(f, parseFrontmatter(raw), true);
					} catch {
						return null;
					}
				}),
			),
		]);

		const posts = [...blogRows, ...draftRows]
			.filter((r): r is Row => r !== null)
			.sort(
				(a, b) =>
					new Date(b.date).getTime() - new Date(a.date).getTime(),
			);

		return { posts, series: Array.from(allSeries).sort() };
	});
});
