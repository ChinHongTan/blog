<script setup lang="ts">
import type { BlogCollectionItem } from "@nuxt/content";
import { getAuthorId } from "~/composables/useAuthorId";

const { data: posts } = await useAsyncData<BlogCollectionItem[]>("series-posts", () =>
	queryCollection("blog").order("date", "DESC").all()
);

// Fetch author directory for avatars
const { data: authorsData } = await useAsyncData("series-index-authors", () =>
	queryCollection("authors").all()
);

type AuthorProfile = { name?: string; avatar?: string; [key: string]: unknown };

const authorDirectory = computed<Record<string, AuthorProfile>>(() => {
	const dir: Record<string, AuthorProfile> = {};
	const records = (authorsData.value ?? []) as unknown as (AuthorProfile & { path?: string })[];
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

// Aggregate all unique series with their article counts and metadata
const seriesList = computed(() => {
	const seriesMap = new Map<string, {
		name: string;
		count: number;
		latestDate: string;
		authors: Set<string>;
		featuredImages: string[];
		description?: string;
	}>();

	(posts.value ?? []).forEach((post) => {
		if (Array.isArray(post.series)) {
			post.series.forEach((seriesName: string) => {
				const existing = seriesMap.get(seriesName);
				if (existing) {
					existing.count++;
					if (post.author) existing.authors.add(post.author);
					if (post.featured_image && !existing.featuredImages.includes(post.featured_image)) {
						existing.featuredImages.push(post.featured_image);
					}
					if (post.date > existing.latestDate) {
						existing.latestDate = post.date;
					}
				} else {
					const authors = new Set<string>();
					if (post.author) authors.add(post.author);
					seriesMap.set(seriesName, {
						name: seriesName,
						count: 1,
						latestDate: post.date,
						authors,
						featuredImages: post.featured_image ? [post.featured_image] : [],
						description: post.description,
					});
				}
			});
		}
	});

	return Array.from(seriesMap.values())
		.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
});

useHead({
	title: "專欄 - 七糯糯的小站",
});
</script>

<template>
	<div class="series-page">
		<header class="page-header">
			<h1 class="page-title">
				<Icon name="heroicons:bookmark-square" size="36" />
				專欄
			</h1>
			<p class="page-description">
				系列文章合集，按主題整理的深度內容
			</p>
		</header>

		<div v-if="seriesList.length > 0" class="series-grid">
			<NuxtLink
				v-for="series in seriesList"
				:key="series.name"
				:to="`/series/${encodeURIComponent(series.name)}`"
				class="series-card"
			>
				<!-- Big cover image -->
				<div class="series-image">
					<img
						v-if="series.featuredImages.length"
						:src="series.featuredImages[0]"
						:alt="series.name"
					>
					<div v-else class="series-image-placeholder">
						<Icon name="heroicons:book-open" size="56" />
					</div>
					<!-- Overlay badge -->
					<div class="series-image-badge">
						<Icon name="heroicons:bookmark-square" size="14" />
						{{ series.count }} 篇文章
					</div>
				</div>

				<!-- Card body -->
				<div class="series-body">
					<h2 class="series-title">{{ series.name }}</h2>

					<div class="series-meta-row">
						<div class="series-meta-main">
							<!-- Author avatars stack -->
							<div class="series-authors-stack">
								<img
									v-for="authorId in Array.from(series.authors).slice(0, 3)"
									:key="authorId"
									:src="authorDirectory[authorId]?.avatar ?? fallbackAvatar(authorDirectory[authorId]?.name ?? authorId)"
									:alt="authorDirectory[authorId]?.name ?? authorId"
									class="series-author-avatar"
								>
							</div>
							<div class="series-meta-text">
								<span class="series-author-names">
									{{ Array.from(series.authors).slice(0, 2).map((id) => authorDirectory[id]?.name ?? id).join("、") }}
									<template v-if="series.authors.size > 2">
										等 {{ series.authors.size }} 位作者
									</template>
								</span>
								<span class="series-date">
									<Icon name="heroicons:calendar-days" size="15" class="meta-icon" />
									最近更新：{{
										new Date(series.latestDate).toLocaleDateString("zh-TW", {
											year: "numeric",
											month: "2-digit",
											day: "2-digit",
										})
									}}
								</span>
							</div>
						</div>
						<span class="series-readmore">
							<span>查看專欄</span>
							<Icon name="heroicons:chevron-right" size="16" />
						</span>
					</div>
				</div>
			</NuxtLink>
		</div>

		<div v-else class="no-results">
			<Icon name="heroicons:bookmark-slash" size="48" />
			<p>目前還沒有任何專欄。</p>
		</div>
	</div>
</template>

<style scoped>
.series-page {
	max-width: 900px;
	margin: 0 auto;
	padding: 1rem 0;
}

.page-header {
	text-align: center;
	margin-bottom: 2.5rem;
}

.page-title {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.6rem;
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--color-text-primary);
	margin-bottom: 0.5rem;
}

.page-title :deep(svg) {
	color: var(--color-primary);
}

.page-description {
	font-size: 1.1rem;
	color: var(--color-text-secondary);
	margin: 0;
}

/* Grid of series cards — same style as homepage post cards */
.series-grid {
	display: grid;
	gap: 1.65rem;
}

.series-card {
	display: flex;
	flex-direction: column;
	background: color-mix(in srgb, var(--color-bg-primary) 60%, transparent);
	border: 1px solid var(--color-border-light);
	border-radius: 12px;
	overflow: hidden;
	transition: all 0.3s ease;
	box-shadow: var(--shadow-md);
	backdrop-filter: saturate(1.08) blur(10px);
	-webkit-backdrop-filter: saturate(1.08) blur(10px);
	text-decoration: none;
	color: inherit;
}

.series-card:hover {
	transform: translateY(-4px);
	box-shadow: var(--shadow-lg);
	border-color: var(--color-primary-light);
}

/* Big cover image */
.series-image {
	width: 100%;
	height: 220px;
	overflow: hidden;
	background: var(--color-bg-tertiary);
	position: relative;
}

.series-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.series-card:hover .series-image img {
	transform: scale(1.05);
}

.series-image-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(
		135deg,
		color-mix(in srgb, var(--color-primary-light) 25%, var(--color-bg-tertiary)),
		color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-tertiary))
	);
}

.series-image-placeholder :deep(svg) {
	color: var(--color-primary);
	opacity: 0.4;
}

/* Floating badge on the image */
.series-image-badge {
	position: absolute;
	top: 0.75rem;
	right: 0.75rem;
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.3rem 0.65rem;
	background: color-mix(in srgb, var(--color-bg-primary) 80%, transparent);
	backdrop-filter: blur(8px);
	border: 1px solid color-mix(in srgb, var(--color-border-light) 60%, transparent);
	border-radius: 999px;
	font-size: 0.78rem;
	font-weight: 600;
	color: var(--color-primary-dark);
}

/* Card body — mirrors homepage post-content */
.series-body {
	padding: 1.35rem;
	display: flex;
	flex-direction: column;
	flex: 1;
	gap: 0.8rem;
}

.series-title {
	font-size: 1.4rem;
	font-weight: 700;
	color: var(--color-text-primary);
	line-height: 1.4;
	margin: 0;
}

.series-card:hover .series-title {
	color: var(--color-primary-dark);
}

/* Meta row — mirrors homepage post-meta-row */
.series-meta-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	flex-wrap: nowrap;
	gap: 0.5rem;
	margin-top: 0.25rem;
}

.series-meta-main {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
}

.series-authors-stack {
	display: flex;
	flex-shrink: 0;
}

.series-author-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid var(--color-bg-primary);
	margin-left: -8px;
}

.series-author-avatar:first-child {
	margin-left: 0;
}

.series-meta-text {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 0.55rem;
	font-size: 0.9rem;
	color: var(--color-text-tertiary);
	min-width: 0;
	flex: 1;
}

.series-author-names {
	font-weight: 600;
	color: var(--color-text-primary);
	font-size: 0.9rem;
}

.series-date {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	color: var(--color-text-secondary);
}

.meta-icon {
	color: var(--color-text-tertiary);
}

.series-readmore {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	width: fit-content;
	align-self: flex-end;
	font-size: 0.94rem;
	font-weight: 600;
	color: var(--color-primary-dark);
	padding: 0.2rem 0.45rem;
	border-radius: 8px;
	white-space: nowrap;
	transition: all 0.2s ease;
}

.series-card:hover .series-readmore {
	background: color-mix(in srgb, var(--color-primary-light) 14%, transparent);
}

.series-readmore :deep(svg) {
	transition: transform 0.2s ease;
}

.series-card:hover .series-readmore :deep(svg) {
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
	.series-page {
		padding: 0.5rem 0;
	}

	.page-title {
		font-size: 2rem;
	}

	.series-image {
		height: 180px;
	}

	.series-body {
		padding: 1.1rem;
	}

	.series-title {
		font-size: 1.2rem;
	}

	.series-meta-row {
		flex-wrap: wrap;
	}

	.series-readmore {
		margin-left: auto;
	}
}

@media (max-width: 480px) {
	.page-title {
		font-size: 1.6rem;
	}

	.series-image {
		height: 150px;
	}

	.series-title {
		font-size: 1.1rem;
	}

	.series-meta-text {
		flex-wrap: wrap;
		gap: 0.3rem;
	}
}
</style>
