function extractNodeText(node: unknown): string {
	if (typeof node === "string") return node;
	if (!Array.isArray(node)) return "";
	return node.slice(2).map(extractNodeText).join("");
}

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function buildPostExcerpt(body: unknown, maxLength = 120): string {
	if (!body || typeof body !== "object") return "";
	const value = (body as { value?: unknown }).value;
	if (!Array.isArray(value)) return "";

	for (const node of value) {
		if (!Array.isArray(node) || node[0] !== "p") continue;
		const text = normalizeWhitespace(extractNodeText(node));
		if (text.length >= 20) return truncate(text, maxLength);
	}

	const allText = normalizeWhitespace(value.map(extractNodeText).join(" "));
	if (!allText) return "";
	return truncate(allText, maxLength);
}
