export type StemSource = {
	stem?: string;
	id?: string;
	path?: string;
};

export function safeDecode(value: string): string {
	let decoded = value;
	for (let i = 0; i < 2; i += 1) {
		try {
			const next = decodeURIComponent(decoded);
			if (next === decoded) break;
			decoded = next;
		} catch {
			break;
		}
	}
	return decoded;
}

export function normalizePath(value: string): string {
	if (!value) return "/";
	const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
	if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
		return withLeadingSlash.slice(0, -1);
	}
	return withLeadingSlash;
}

export function getPostStem(
	post: StemSource | null | undefined,
): string {
	let stem = post?.stem || post?.id || post?.path || "";
	stem = stem.replace(/\.md$/, "");
	stem = stem.replace(/^(?:\/?(?:content\/)?blog\/)+/, "");
	stem = stem.replace(/^\//, "");
	return stem;
}
