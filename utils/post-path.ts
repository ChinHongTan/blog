export type PostPathSource = {
	path?: string;
	stem?: string;
	id?: string;
};

export function resolvePostPath(
	post: PostPathSource | null | undefined,
	fallback = "/blog",
): string {
	if (post?.path && post.path !== "/blog") return post.path;
	if (post?.stem) return `/${post.stem}`;
	if (post?.id) {
		const derivedStem = post.id.replace(/^blog\//, "").replace(/\.md$/, "");
		return `/${derivedStem}`;
	}
	return post?.path ?? fallback;
}
