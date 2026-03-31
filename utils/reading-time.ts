function extractMinimarkText(node: unknown): string {
	if (!node) return "";
	if (typeof node === "string") return node;

	if (Array.isArray(node)) {
		return node
			.slice(2)
			.map((item) => extractMinimarkText(item))
			.join(" ");
	}

	if (typeof node === "object" && node !== null && "type" in node && "value" in node) {
		const obj = node as { type: string; value: unknown };
		if (obj.type === "minimark" && Array.isArray(obj.value)) {
			return obj.value.map((item) => extractMinimarkText(item)).join(" ");
		}
	}

	return "";
}

export function estimateReadingMinutes(body: unknown): number {
	if (!body) return 1;
	const bodyText = extractMinimarkText(body);
	const cjkRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g;
	const cjkCharacters = (bodyText.match(cjkRegex) || []).length;
	const nonCjkText = bodyText.replace(cjkRegex, " ");
	const nonCjkWords = nonCjkText
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;
	const readingMinutes = Math.ceil(cjkCharacters / 400 + nonCjkWords / 200);
	return Math.max(1, readingMinutes);
}
