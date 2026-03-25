interface PostMeta {
	title: string;
	description: string;
	date: string;
	edited_at: string;
	author: string;
	path: string;
	series: string[];
	tags: string[];
	featured_image: string;
}

interface AuthorMeta {
	name: string;
	bio: string;
	avatar: string;
	banner: string;
	github: string;
	website: string;
}

type EditorMeta = PostMeta & AuthorMeta;

export function buildPostFrontmatter(meta: PostMeta): string {
	const lines: string[] = ["---"];
	if (meta.title) lines.push(`title: ${meta.title}`);
	if (meta.description) lines.push(`description: ${meta.description}`);
	if (meta.date) lines.push(`date: ${meta.date}`);
	if (meta.edited_at) lines.push(`edited_at: ${meta.edited_at}`);
	if (meta.author) lines.push(`author: ${meta.author}`);
	if (meta.path) lines.push(`path: ${meta.path}`);
	if (meta.featured_image)
		lines.push(`featured_image: ${meta.featured_image}`);
	if (meta.series.length)
		lines.push(`series:\n  - ${meta.series.join("\n  - ")}`);
	if (meta.tags.length) lines.push(`tags:\n  - ${meta.tags.join("\n  - ")}`);
	lines.push("---");
	return lines.join("\n");
}

export function buildAuthorFrontmatter(meta: AuthorMeta): string {
	const lines: string[] = ["---"];
	if (meta.name) lines.push(`name: ${meta.name}`);
	if (meta.bio) lines.push(`bio: "${(meta.bio || "").replace(/"/g, '\\"')}"`);
	if (meta.avatar) lines.push(`avatar: ${meta.avatar}`);
	if (meta.banner) lines.push(`banner: ${meta.banner}`);
	if (meta.github || meta.website) {
		lines.push("social:");
		if (meta.github) lines.push(`  github: ${meta.github}`);
		lines.push('  twitter: ""');
		if (meta.website) lines.push(`  website: ${meta.website}`);
	}
	lines.push("---");
	return lines.join("\n");
}

export function buildFrontmatter(docType: string, meta: EditorMeta): string {
	if (docType === "author") return buildAuthorFrontmatter(meta);
	return buildPostFrontmatter(meta);
}

export function parseFrontmatter(
	raw: string,
	docType: string,
): { meta: Partial<EditorMeta>; body: string } {
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
	if (!match) return { meta: {}, body: raw };

	const front = match[1];
	const body = match[2].trim();
	const result: Partial<EditorMeta> = {};

	front.split("\n").forEach((line) => {
		const m = line.match(/^(\w+):\s*(.*)$/);
		if (m) {
			const key = m[1];
			const val = m[2].trim().replace(/^["']|["']$/g, "");
			if (
				key === "series" ||
				key === "tags" ||
				key === "social" ||
				key === "email"
			)
				return;
			(result as Record<string, string>)[key] = val;
		}
	});

	if (docType === "post" && raw.includes("series:")) {
		const seriesMatch = raw.match(/series:\s*\n((?:\s+-\s*.+\n?)+)/);
		if (seriesMatch) {
			result.series = seriesMatch[1]
				.split(/\n/)
				.map((s) => s.replace(/^\s*-\s*/, "").trim())
				.map((s) => s.replace(/^["']|["']$/g, ""))
				.filter(Boolean);
		}
	}

	if (docType === "post" && raw.includes("tags:")) {
		const tagsMatch = raw.match(/tags:\s*\n((?:\s+-\s*.+\n?)+)/);
		if (tagsMatch) {
			result.tags = tagsMatch[1]
				.split(/\n/)
				.map((s) => s.replace(/^\s*-\s*/, "").trim())
				.map((s) => s.replace(/^["']|["']$/g, ""))
				.filter(Boolean);
		}
	}

	if (docType === "post" && raw.includes("featured_image:")) {
		const fi = raw.match(/featured_image:\s*(.+)/m);
		if (fi) result.featured_image = fi[1].trim();
	}

	if (docType === "author" && raw.includes("social:")) {
		const gh = raw.match(/github:\s*(.+)/m);
		const web = raw.match(/website:\s*(.+)/m);
		if (gh) result.github = gh[1].trim();
		if (web) result.website = web[1].trim();
	}

	return { meta: result, body };
}

export function slugifyTitle(title: string): string {
	const s = (title || "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[/\\?*:|<>"]/g, "");
	return s || "untitled";
}
