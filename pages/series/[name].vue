<script setup lang="ts">
import type { BlogCollectionItem } from "@nuxt/content";
import { getAuthorId } from "~/composables/useAuthorId";

const route = useRoute();

const seriesName = computed(() => {
	const raw = route.params.name;
	if (Array.isArray(raw)) return decodeURIComponent(raw[0] || "");
	return decodeURIComponent(raw || "");
});

const { data: allPosts } = await useAsyncData<BlogCollectionItem[]>(
	`series-${seriesName.value}`,
	() => queryCollection("blog").order("date", "DESC").all()
);

// Filter posts that belong to this series
const seriesPosts = computed(() => {
	return (allPosts.value ?? []).filter(
		(post) =>
			Array.isArray(post.series) && post.series.includes(seriesName.value)
	);
});

// Enrich posts with proper paths
function getPostPath(post: BlogCollectionItem): string {
	if (post.path && post.path !== "/blog") return post.path;
	if (post.stem) return `/${post.stem}`;
	if (post.id) {
		const derivedStem = post.id.replace(/^blog\//, "").replace(/\.md$/, "");
		return `/${derivedStem}`;
	}
	return post.path ?? "/blog";
}

// Fetch author directory for avatars
const { data: authors } = await useAsyncData("series-authors", () =>
	queryCollection("authors").all()
);

type AuthorProfile = { name?: string; avatar?: string; [key: string]: unknown };

const authorDirectory = computed<Record<string, AuthorProfile>>(() => {
	const dir: Record<string, AuthorProfile> = {};
	const records = (authors.value ?? []) as unknown as (AuthorProfile & { path?: string })[];
	records.forEach((entry) => {
		const id = getAuthorId(entry);
		if (id) dir[id] = entry;
	});
	return dir;
});

function fallbackAvatar(label: string, size = 32) {
	const initial = (label?.trim()?.[0] ?? "A").toUpperCase();
	return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${initial}`;
}

function getAuthorAvatar(authorId: string): string {
	const entry = authorDirectory.value[authorId];
	return entry?.avatar ?? fallbackAvatar(entry?.name ?? authorId);
}

useHead({
	title: `專欄 - ${seriesName.value} - 七糯糯的小站`,
});
</script>

<template>
	<div class="series-detail-page">
		<header class="page-header">
			<NuxtLink to="/series" class="breadcrumb">
				<Icon name="heroicons:arrow-left" size="18" />
				所有專欄
			</NuxtLink>
			<h1 class="page-title">
				<Icon name="heroicons:bookmark-square" size="32" />
				專欄 — {{ seriesName }}
			</h1>
			<p class="page-meta-info">
				共 {{ seriesPosts.length }} 篇文章
			</p>
		</header>

		<div v-if="seriesPosts.length > 0" class="articles-list">
			<NuxtLink
				v-for="(post, index) in seriesPosts"
				:key="post.id"
				:to="`${getPostPath(post)}?series=${encodeURIComponent(seriesName)}`"
				class="article-card"
			>
				<!-- Side thumbnail image -->
				<div v-if="post.featured_image" class="article-image">
					<img :src="post.featured_image" :alt="post.title">
				</div>
				<div v-else class="article-image article-image-placeholder">
					<Icon name="heroicons:document-text" size="32" />
				</div>

				<!-- Card body -->
				<div class="article-body">
					<h2 class="article-title">{{ post.title }}</h2>
					<p v-if="post.description" class="article-description">
						{{ post.description }}
					</p>
					<div class="article-meta">
						<span class="article-number-badge">#{{ index + 1 }}</span>
						<div v-if="post.author" class="article-author">
							<img
								:src="getAuthorAvatar(post.author)"
								:alt="post.author"
								class="author-tiny-avatar"
							>
							<span>{{ post.author }}</span>
						</div>
						<span class="article-date">
							<Icon name="heroicons:calendar-days" size="14" />
							{{
								new Date(post.date).toLocaleDateString("zh-TW", {
									year: "numeric",
									month: "2-digit",
									day: "2-digit",
								})
							}}
						</span>
						<div
							v-if="Array.isArray(post.tags) && post.tags.length"
							class="article-tags"
						>
							<span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="tag-chip">
								#{{ tag }}
							</span>
						</div>
					</div>
				</div>

				<div class="article-arrow">
					<Icon name="heroicons:chevron-right" size="20" />
				</div>
			</NuxtLink>
		</div>

		<div v-else class="no-results">
			<Icon name="heroicons:document-magnifying-glass" size="48" />
			<p>此專欄目前沒有文章。</p>
		</div>
	</div>
</template>

<style scoped>
.series-detail-page {
	max-width: 900px;
	margin: 0 auto;
	padding: 1rem 0;
}

.page-header {
	margin-bottom: 2rem;
}

.breadcrumb {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.9rem;
	font-weight: 500;
	color: var(--color-primary-dark);
	text-decoration: none;
	margin-bottom: 0.75rem;
	transition: all 0.2s ease;
}

.breadcrumb:hover {
	color: var(--color-primary);
	gap: 0.6rem;
}

.page-title {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	font-size: 2.2rem;
	font-weight: 700;
	color: var(--color-text-primary);
	margin: 0;
	line-height: 1.3;
}

.page-title :deep(svg) {
	color: var(--color-primary);
	flex-shrink: 0;
}

.page-meta-info {
	font-size: 0.95rem;
	color: var(--color-text-secondary);
	margin: 0.5rem 0 0;
}

/* Horizontal card rows */
.articles-list {
	display: flex;
	flex-direction: column;
	gap: 1.2rem;
}

.article-card {
	display: flex;
	align-items: stretch;
	background: color-mix(in srgb, var(--color-bg-primary) 60%, transparent);
	border: 1px solid var(--color-border-light);
	border-radius: 14px;
	overflow: hidden;
	text-decoration: none;
	color: inherit;
	transition: all 0.3s ease;
	box-shadow: var(--shadow-sm);
	backdrop-filter: saturate(1.08) blur(10px);
	-webkit-backdrop-filter: saturate(1.08) blur(10px);
}

.article-card:hover {
	transform: translateY(-3px);
	box-shadow: var(--shadow-lg);
	border-color: var(--color-primary-light);
}

/* Side thumbnail image */
.article-image {
	width: 200px;
	min-height: 140px;
	flex-shrink: 0;
	overflow: hidden;
	background: var(--color-bg-tertiary);
}

.article-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.article-card:hover .article-image img {
	transform: scale(1.05);
}

.article-image-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(
		135deg,
		color-mix(in srgb, var(--color-primary-light) 20%, var(--color-bg-tertiary)),
		color-mix(in srgb, var(--color-accent) 10%, var(--color-bg-tertiary))
	);
}

.article-image-placeholder :deep(svg) {
	color: var(--color-primary);
	opacity: 0.4;
}

/* Card body */
.article-body {
	flex: 1;
	padding: 1.25rem 1.5rem;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 0.5rem;
	min-width: 0;
}

.article-title {
	font-size: 1.28rem;
	font-weight: 600;
	color: var(--color-text-primary);
	margin: 0;
	line-height: 1.4;
}

.article-card:hover .article-title {
	color: var(--color-primary-dark);
}

.article-description {
	font-size: 0.92rem;
	color: var(--color-text-secondary);
	margin: 0;
	line-height: 1.6;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.article-meta {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	flex-wrap: wrap;
	margin-top: 0.15rem;
}

.article-number-badge {
	font-size: 0.78rem;
	font-weight: 700;
	color: var(--color-primary-dark);
	background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
	padding: 0.12rem 0.5rem;
	border-radius: 999px;
}

.article-author {
	display: flex;
	align-items: center;
	gap: 0.3rem;
	font-size: 0.85rem;
	color: var(--color-text-secondary);
	font-weight: 500;
}

.author-tiny-avatar {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--color-border-light);
}

.article-date {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.82rem;
	color: var(--color-text-tertiary);
}

.article-tags {
	display: flex;
	gap: 0.3rem;
}

.tag-chip {
	font-size: 0.78rem;
	color: var(--color-text-tertiary);
	background: color-mix(in srgb, var(--color-bg-secondary) 70%, transparent);
	border: 1px solid var(--color-border-light);
	padding: 0.12rem 0.45rem;
	border-radius: 999px;
}

.article-arrow {
	display: flex;
	align-items: center;
	padding: 0 1rem;
	color: var(--color-text-tertiary);
	transition: all 0.2s ease;
}

.article-card:hover .article-arrow {
	color: var(--color-primary);
	transform: translateX(4px);
}

.no-results {
	text-align: center;
	padding: 4rem 1rem;
	color: var(--color-text-tertiary);
}

.no-results :deep(svg) {
	color: var(--color-border-medium);
	margin-bottom: 1rem;
}

@media (max-width: 768px) {
	.page-title {
		font-size: 1.6rem;
	}

	.article-card {
		flex-direction: column;
	}

	.article-image {
		width: 100%;
		height: 160px;
		min-height: auto;
	}

	.article-body {
		padding: 1.1rem;
	}

	.article-title {
		font-size: 1.1rem;
	}

	.article-arrow {
		display: none;
	}
}

@media (max-width: 480px) {
	.page-title {
		font-size: 1.35rem;
	}

	.article-image {
		height: 130px;
	}

	.article-body {
		padding: 0.9rem;
	}

	.article-title {
		font-size: 1rem;
	}

	.article-tags {
		display: none;
	}
}
</style>
