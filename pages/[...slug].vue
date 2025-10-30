<script setup lang="ts">
const route = useRoute();

// Don't match /admin paths - let them be handled by static files
if (route.path.startsWith("/admin")) {
	throw createError({
		statusCode: 404,
		statusMessage: "Page Not Found",
		fatal: false,
	});
}

// Try to fetch from blog collection first, then pages collection
const { data: page } = await useAsyncData(route.path, async () => {
	// Try blog collection first with exact path
	const blogResult = await queryCollection("blog").path(route.path).first();
	if (blogResult) {
		return blogResult;
	}

	// Derive stem from catch-all slug params (e.g. ['blog', 'post-name'])
	const slugParam = route.params.slug;
	const slugSegments = Array.isArray(slugParam)
		? slugParam.filter(
				(segment): segment is string =>
					typeof segment === "string" && segment.length > 0
			)
		: typeof slugParam === "string" && slugParam.length > 0
			? [slugParam]
			: [];
	const targetStem = slugSegments.join("/");

	if (targetStem) {
		const blogByStem = await queryCollection("blog")
			.where("stem", "=", targetStem)
			.first();
		if (blogByStem) {
			return blogByStem;
		}

		const pageByStem = await queryCollection("pages")
			.where("stem", "=", targetStem)
			.first();
		if (pageByStem) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return pageByStem as any;
		}
	}

	// Fallback: try pages collection by path
	const pageResult = await queryCollection("pages").path(route.path).first();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return pageResult as any;
});

// Determine if this is a blog post (has date and author)
const isBlogPost = computed(
	() => page.value && "date" in page.value && "author" in page.value
);

// Check if page has a date but is not a blog post (like static pages with last updated date)
const hasDate = computed(() => page.value && "date" in page.value);

// Fetch author profile if author name exists and it's a blog post
const authorProfile =
	page.value && "author" in page.value && page.value.author
		? await useAuthor(page.value.author)
		: null;

// Get author avatar - prioritize from author profile, then fallback to placeholder
const authorAvatar = computed(() => {
	if (authorProfile?.value) {
		const profile = authorProfile.value as { avatar?: string };
		if (profile.avatar) return profile.avatar;
	}
	// Fallback to placeholder
	const firstLetter = page.value?.author?.[0] || "A";
	return `https://placehold.co/40x40/38bdf8/ffffff?text=${firstLetter}`;
});

// Calculate reading time (assuming average reading speed of 200 words per minute)
const readingTime = computed(() => {
	if (!page.value?.body) return 1;

	// Extract text content from minimark format
	// Minimark structure: ['tagName', attributes, ...content]
	const extractText = (node: unknown): string => {
		if (!node) return "";

		// If it's a string, return it directly
		if (typeof node === "string") {
			return node;
		}

		// If it's an array (minimark element: [tag, attrs, ...children])
		if (Array.isArray(node)) {
			// Skip the first two elements (tag name and attributes) and process the rest
			return node
				.slice(2)
				.map((item) => extractText(item))
				.join(" ");
		}

		// If it's an object with type 'minimark' and value array
		if (
			typeof node === "object" &&
			node !== null &&
			"type" in node &&
			"value" in node
		) {
			const obj = node as { type: string; value: unknown };
			if (obj.type === "minimark" && Array.isArray(obj.value)) {
				return obj.value.map((item) => extractText(item)).join(" ");
			}
		}

		return "";
	};

	const bodyText = extractText(page.value.body);

	// For CJK (Chinese, Japanese, Korean) text, count characters instead of words
	// For mixed content, count both CJK characters and non-CJK words
	const cjkRegex =
		/[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g;
	const cjkCharacters = (bodyText.match(cjkRegex) || []).length;

	// Remove CJK characters and count remaining words
	const nonCjkText = bodyText.replace(cjkRegex, " ");
	const nonCjkWords = nonCjkText
		.trim()
		.split(/\s+/)
		.filter((w) => w.length > 0).length;

	// Average reading speed: 200 words/min for English, 400-500 characters/min for Chinese
	// We'll use 400 characters/min for Chinese
	const readingMinutes = Math.ceil(cjkCharacters / 400 + nonCjkWords / 200);

	return Math.max(1, readingMinutes); // At least 1 minute
});
</script>

<template>
	<article v-if="page" class="blog-post">
		<!-- Post Header -->
		<header class="post-header">
			<h1 class="post-title">{{ page.title }}</h1>

			<!-- Simple date display for static pages (pages with date but no author) -->
			<div v-if="hasDate && !isBlogPost" class="page-meta">
				<span class="meta-item">
					<Icon name="heroicons:calendar" size="16" />
					最後更新：{{
						new Date(page.date).toLocaleDateString("zh-TW", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})
					}}
				</span>
			</div>

			<!-- Post Meta Information (only for blog posts) -->
			<div v-if="isBlogPost" class="post-meta-bar">
				<div class="author-info">
					<img
						:src="authorAvatar"
						:alt="page.author || 'Author'"
						class="author-avatar"
					>
					<span class="author-name">{{
						page.author || "Anonymous"
					}}</span>
				</div>

				<div class="meta-divider" />

				<div class="post-meta-items">
					<span class="meta-item">
						<Icon name="heroicons:calendar" size="16" />
						{{
							new Date(page.date).toLocaleDateString("en-US", {
								month: "long",
								day: "numeric",
								year: "numeric",
							})
						}}
					</span>
					<span class="meta-item">
						<Icon name="heroicons:clock" size="16" />
						{{ readingTime }} 分鐘閱讀
					</span>
				</div>
			</div>

			<!-- Tags (only for blog posts) -->
			<div
				v-if="isBlogPost && page.tags && page.tags.length"
				class="post-tags"
			>
				<Icon name="heroicons:tag" size="16" />
				<div class="tags-list">
					<span v-for="tag in page.tags" :key="tag" class="tag">
						{{ tag }}
					</span>
				</div>
			</div>
		</header>

		<!-- Featured Image (only for blog posts) -->
		<div v-if="isBlogPost && page.featured_image" class="featured-image">
			<img :src="page.featured_image" :alt="page.title">
		</div>

		<!-- Post Content -->
		<div class="post-content">
			<ContentRenderer :value="page" />
		</div>

		<!-- Post Footer -->
		<footer class="post-footer">
			<div class="back-link">
				<NuxtLink to="/">
					<Icon name="heroicons:arrow-left" size="20" />
					返回所有文章
				</NuxtLink>
			</div>
		</footer>
	</article>

	<div v-else class="not-found">
		<Icon name="heroicons:document-magnifying-glass" size="64" />
		<h1>找不到文章</h1>
		<p>您尋找的文章不存在。</p>
		<NuxtLink to="/" class="back-button">
			<Icon name="heroicons:home" size="20" />
			返回首頁
		</NuxtLink>
	</div>
</template>

<style scoped>
.blog-post {
	background: var(--color-bg-primary);
	border-radius: 12px;
	padding: 3rem;
	box-shadow: var(--shadow-sm);
	border: 1px solid var(--color-border-light);
}

/* Post Header */
.post-header {
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid var(--color-border-light);
}

.post-title {
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--color-text-primary);
	line-height: 1.2;
	margin-bottom: 0.75rem;
}

.page-meta {
	margin-bottom: 1rem;
}

.page-meta .meta-item {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.9rem;
	color: var(--color-text-secondary);
}

.post-meta-bar {
	display: flex;
	align-items: center;
	gap: 1.5rem;
	flex-wrap: wrap;
	margin-bottom: 1rem;
}

.author-info {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.author-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: 2px solid var(--color-primary-light);
	object-fit: cover;
	aspect-ratio: 1 / 1;
	flex-shrink: 0;
}

.author-name {
	font-weight: 600;
	color: var(--color-text-primary);
	font-size: 0.95rem;
}

.meta-divider {
	width: 1px;
	height: 24px;
	background: var(--color-border-medium);
}

.post-meta-items {
	display: flex;
	gap: 1.5rem;
	flex-wrap: wrap;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.9rem;
	color: var(--color-text-secondary);
}

.meta-item :deep(svg) {
	color: var(--color-primary);
}

.post-tags {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-top: 1rem;
}

.post-tags :deep(svg) {
	color: var(--color-text-tertiary);
}

.tags-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.tag {
	display: inline-block;
	padding: 0.35rem 0.75rem;
	background: var(--color-bg-blue-tint);
	color: var(--color-primary-dark);
	border-radius: 16px;
	font-size: 0.85rem;
	font-weight: 500;
	border: 1px solid var(--color-primary-light);
}

/* Featured Image */
.featured-image {
	margin-bottom: 2.5rem;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: var(--shadow-md);
}

.featured-image img {
	width: 100%;
	height: auto;
	display: block;
}

/* Post Content */
.post-content {
	font-size: 1.05rem;
	line-height: 1.8;
	color: var(--color-text-primary);
}

.post-content :deep(h2) {
	font-size: 2rem;
	margin-top: 2.5rem;
	margin-bottom: 1rem;
	color: var(--color-text-primary);
	padding-bottom: 0.75rem;
	border-bottom: 2px solid var(--color-border-light);
	position: relative;
}

.post-content :deep(h2)::after {
	content: "";
	position: absolute;
	bottom: -2px;
	left: 0;
	width: 60px;
	height: 2px;
	background: var(--color-primary);
}

.post-content :deep(h2 a) {
	color: inherit;
	text-decoration: none;
}

.post-content :deep(h2 a:hover) {
	color: var(--color-primary-dark);
}

.post-content :deep(h3) {
	font-size: 1.5rem;
	margin-top: 2rem;
	margin-bottom: 0.75rem;
	color: var(--color-text-primary);
}

.post-content :deep(h3 a) {
	color: inherit;
	text-decoration: none;
}

.post-content :deep(h3 a:hover) {
	color: var(--color-primary-dark);
}

.post-content :deep(p) {
	margin-bottom: 1.25rem;
}

.post-content :deep(a) {
	color: var(--color-primary-dark);
	text-decoration: underline;
	text-decoration-color: var(--color-primary-light);
	text-underline-offset: 3px;
	transition: all 0.2s ease;
	overflow-wrap: anywhere;
	word-break: break-word;
}

.post-content :deep(a:hover) {
	color: var(--color-primary);
	text-decoration-color: var(--color-primary);
}

.post-content :deep(ul),
.post-content :deep(ol) {
	margin-bottom: 1.5rem;
	padding-left: 2rem;
}

.post-content :deep(li) {
	margin-bottom: 0.5rem;
}

.post-content :deep(blockquote) {
	border-left: 4px solid var(--color-accent);
	padding-left: 1.5rem;
	margin: 1.5rem 0;
	font-style: italic;
	color: var(--color-text-secondary);
	background: var(--color-bg-secondary);
	padding: 1rem 1.5rem;
	border-radius: 0 8px 8px 0;
}

.post-content :deep(img) {
	max-width: 100%;
	height: auto;
	border-radius: 12px;
	margin: 1.5rem 0;
	box-shadow: var(--shadow-md);
}

.post-content :deep(figure) {
	margin: 1.5rem 0;
}

.post-content :deep(figure img) {
	display: block;
	margin: 0;
}

.post-content :deep(figcaption) {
	text-align: center;
	color: var(--color-text-tertiary);
	font-size: 0.9rem;
	margin-top: 0.75rem;
	font-style: italic;
	line-height: 1.4;
}

.post-content :deep(.info-box) {
	padding: 1rem 1.5rem;
	border-radius: 8px;
	margin: 1.5rem 0;
	border-left: 4px solid;
}

.post-content :deep(.info-box strong) {
	display: block;
	margin-bottom: 0.5rem;
	font-size: 1.1rem;
	font-weight: 600;
}

.post-content :deep(.info-box p) {
	margin: 0;
	line-height: 1.6;
}

.post-content :deep(.info-box-info) {
	background: #e0f2fe;
	border-color: var(--color-primary);
	color: var(--color-primary-dark);
}

.post-content :deep(.info-box-success) {
	background: #d1fae5;
	border-color: #10b981;
	color: #059669;
}

.post-content :deep(.info-box-warning) {
	background: #fef3c7;
	border-color: #f59e0b;
	color: #d97706;
}

.post-content :deep(.info-box-error) {
	background: #fee2e2;
	border-color: #ef4444;
	color: #dc2626;
}

html.dark .post-content :deep(.info-box-info) {
	background: rgba(14, 165, 233, 0.18);
	border-color: #38bdf8;
	color: #bae6fd;
}

html.dark .post-content :deep(.info-box-success) {
	background: rgba(16, 185, 129, 0.18);
	border-color: #34d399;
	color: #bbf7d0;
}

html.dark .post-content :deep(.info-box-warning) {
	background: rgba(245, 158, 11, 0.18);
	border-color: #fbbf24;
	color: #fcd34d;
}

html.dark .post-content :deep(.info-box-error) {
	background: rgba(239, 68, 68, 0.18);
	border-color: #f87171;
	color: #fecaca;
}

.post-content :deep(.youtube-embed) {
	position: relative;
	padding-bottom: 56.25%;
	height: 0;
	overflow: hidden;
	max-width: 100%;
	margin: 1.5rem 0;
	border-radius: 12px;
	box-shadow: var(--shadow-md);
}

.post-content :deep(.youtube-embed iframe) {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border: none;
}

.post-content :deep(blockquote cite) {
	display: block;
	margin-top: 0.75rem;
	font-style: normal;
	color: var(--color-text-tertiary);
	font-size: 0.9rem;
	font-weight: 500;
}

.post-content :deep(pre) {
	margin: 1.5rem 0;
	background: var(--color-text-primary);
	border-radius: 8px;
	box-shadow: var(--shadow-md);
}

.post-content :deep(code) {
	font-size: 0.9em;
}

/* MathJax Display Math - Center block equations */
.post-content :deep(mjx-container[jax="SVG"][display="true"]) {
	display: block !important;
	text-align: center !important;
	margin: 2rem auto !important;
	overflow-x: auto;
}

.post-content :deep(mjx-container[jax="SVG"][display="true"] > svg) {
	display: inline-block !important;
	max-width: 100%;
}

/* Also handle PascalCase version if Nuxt Content converts it */
.post-content :deep(MjxContainer[jax="SVG"][display="true"]) {
	display: block !important;
	text-align: center !important;
	margin: 2rem auto !important;
	overflow-x: auto;
}

.post-content :deep(MjxContainer[jax="SVG"][display="true"] > svg) {
	display: inline-block !important;
	max-width: 100%;
}

/* Post Footer */
.post-footer {
	margin-top: 3rem;
	padding-top: 2rem;
	border-top: 1px solid var(--color-border-light);
}

.back-link a {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--color-primary-dark);
	font-weight: 500;
	text-decoration: none;
	transition: all 0.2s ease;
}

.back-link a:hover {
	color: var(--color-primary);
	gap: 0.75rem;
}

/* Not Found */
.not-found {
	text-align: center;
	padding: 4rem 2rem;
	background: var(--color-bg-primary);
	border-radius: 12px;
	border: 1px solid var(--color-border-light);
}

.not-found :deep(svg) {
	color: var(--color-border-medium);
	margin-bottom: 1.5rem;
}

.not-found h1 {
	color: var(--color-text-primary);
	margin-bottom: 0.5rem;
}

.not-found p {
	color: var(--color-text-secondary);
	margin-bottom: 2rem;
}

.back-button {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background: var(--color-primary);
	color: white;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 500;
	transition: all 0.2s ease;
}

.back-button:hover {
	background: var(--color-primary-dark);
	transform: translateY(-2px);
	box-shadow: var(--shadow-md);
}

/* Responsive */
@media (max-width: 768px) {
	.blog-post {
		padding: 1.5rem 1rem;
		border-radius: 8px;
	}

	.post-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
	}

	.post-title {
		font-size: 1.75rem;
		line-height: 1.3;
		margin-bottom: 0.75rem;
	}

	.post-meta-bar {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.author-info {
		gap: 0.5rem;
	}

	.author-avatar {
		width: 32px;
		height: 32px;
	}

	.author-name {
		font-size: 0.9rem;
	}

	.meta-divider {
		display: none;
	}

	.post-meta-items {
		gap: 1rem;
	}

	.meta-item {
		font-size: 0.85rem;
	}

	.post-tags {
		margin-top: 0.75rem;
	}

	.tag {
		padding: 0.25rem 0.6rem;
		font-size: 0.8rem;
	}

	.featured-image {
		margin-bottom: 1.5rem;
		border-radius: 8px;
	}

	.post-content {
		font-size: 0.95rem;
		line-height: 1.7;
	}

	.post-content :deep(h2) {
		font-size: 1.5rem;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}

	.post-content :deep(h3) {
		font-size: 1.25rem;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.post-content :deep(p) {
		margin-bottom: 1rem;
	}

	.post-content :deep(ul),
	.post-content :deep(ol) {
		margin-bottom: 1.25rem;
		padding-left: 1.5rem;
	}

	.post-content :deep(blockquote) {
		padding: 0.75rem 1rem;
		margin: 1.25rem 0;
		font-size: 0.9rem;
	}

	.post-content :deep(img) {
		margin: 1.25rem 0;
		border-radius: 6px;
	}

	.post-content :deep(pre) {
		margin: 1.25rem -1rem;
		border-radius: 0;
		font-size: 0.85rem;
	}

	.post-footer {
		margin-top: 2rem;
		padding-top: 1.5rem;
	}

	.back-link a {
		font-size: 0.9rem;
	}

	.not-found {
		padding: 3rem 1.5rem;
	}

	.not-found h1 {
		font-size: 1.5rem;
	}

	.not-found p {
		font-size: 0.9rem;
	}
}

/* Extra small screens */
@media (max-width: 480px) {
	.blog-post {
		padding: 1rem 0.75rem;
	}

	.post-title {
		font-size: 1.5rem;
	}

	.post-content {
		font-size: 0.9rem;
	}

	.post-content :deep(h2) {
		font-size: 1.3rem;
	}

	.post-content :deep(h3) {
		font-size: 1.1rem;
	}
}
</style>
