interface PostMeta {
	title: string;
	description: string;
	date: string;
	edited_at: string;
	author: string;
	path: string;
	series?: string[];
	tags: string[];
	featured_image: string;
	pinned?: boolean;
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

function yamlScalar(value: string): string {
	const needsQuoting =
		value === "" ||
		/:(\s|$)/.test(value) ||
		/\s#/.test(value) ||
		/^[\s\-?:,\[\]{}&*!|>'"%@`#]/.test(value) ||
		/\s$/.test(value) ||
		/^(true|false|null|yes|no|on|off|~)$/i.test(value);
	if (!needsQuoting) return value;
	if (!value.includes('"')) return `"${value.replace(/\\/g, "\\\\")}"`;
	return `'${value.replace(/'/g, "''")}'`;
}

export function buildPostFrontmatter(meta: PostMeta): string {
	const lines: string[] = ["---"];
	if (meta.title) lines.push(`title: ${yamlScalar(meta.title)}`);
	if (meta.description)
		lines.push(`description: ${yamlScalar(meta.description)}`);
	if (meta.date) lines.push(`date: ${yamlScalar(meta.date)}`);
	if (meta.edited_at)
		lines.push(`edited_at: ${yamlScalar(meta.edited_at)}`);
	if (meta.author) lines.push(`author: ${yamlScalar(meta.author)}`);
	if (meta.path) lines.push(`path: ${yamlScalar(meta.path)}`);
	if (meta.featured_image)
		lines.push(`featured_image: ${yamlScalar(meta.featured_image)}`);
	if (meta.pinned) lines.push("pinned: true");
	if (meta.tags && meta.tags.length)
		lines.push(
			`tags:\n  - ${meta.tags.map((t) => yamlScalar(t)).join("\n  - ")}`,
		);
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
				key === "pinned" &&
				docType === "post" &&
				(val.toLowerCase() === "true" || val.toLowerCase() === "false")
			) {
				(result as Record<string, unknown>).pinned =
					val.toLowerCase() === "true";
				return;
			}
			if (
				key === "series" ||
				key === "tags" ||
				key === "social" ||
				key === "email"
			)
				return;
			if (key === "seriesOrder" && docType === "post") {
				const num = Number(val);
				if (!Number.isNaN(num)) {
					(result as Record<string, unknown>).seriesOrder = num;
				}
				return;
			}
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
