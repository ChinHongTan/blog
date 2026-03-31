export function buildFallbackAvatar(
	label: string | undefined,
	size = 40,
): string {
	const safeLabel = label?.trim();
	const initial = (safeLabel ? safeLabel[0] : "A")?.toUpperCase() ?? "A";
	const encodedInitial = encodeURIComponent(initial);
	return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${encodedInitial}`;
}
