<script setup lang="ts">
import type { BlogCollectionItem } from "@nuxt/content";
import { getAuthorId } from "~/composables/useAuthorId";

const route = useRoute();

/** Route param is the immutable author ID (e.g. chinono). */
const authorId = computed(() => {
	const raw = route.params.name;
	if (Array.isArray(raw)) return decodeURIComponent(raw[0] || "");
	return decodeURIComponent(raw || "");
});

// Fetch all authors for metadata
const { data: allAuthors } = await useAsyncData("author-profiles-list", () =>
	queryCollection("authors").all()
);

type AuthorProfile = {
	name?: string;
	email?: string;
	bio?: string;
	avatar?: string;
	banner?: string;
	body?: unknown;
	social?: {
		github?: string;
		twitter?: string;
		website?: string;
	};
	[key: string]: unknown;
};

const authorRecord = computed(() => {
	const records = (allAuthors.value ?? []) as unknown as (AuthorProfile & { path?: string })[];
	return records.find((a) => getAuthorId(a) === authorId.value) ?? null;
});

// Fetch author page separately to get body content for README
const { data: authorPage } = await useAsyncData(
	`author-page-${authorId.value}`,
	async () => {
		const all = await queryCollection("authors").all();
		const match = all.find((a: { path?: string; name?: string }) => getAuthorId(a) === authorId.value);
		if (!match) return null;
		if ((match as { path?: string }).path) {
			const full = await queryCollection("authors").path((match as { path: string }).path).first();
			return full;
		}
		return match;
	}
);

const hasReadme = computed(() => {
	const record = authorPage.value;
	if (!record?.body) return false;
	const body = record.body as { type?: string; value?: unknown[]; children?: unknown[] };
	// Check various body formats
	if (body.type === 'minimark' && Array.isArray(body.value) && body.value.length > 0) return true;
	if (Array.isArray(body.children) && body.children.length > 0) return true;
	// If body itself looks like it has content
	if (typeof body === 'object' && body !== null) {
		const keys = Object.keys(body);
		return keys.length > 0;
	}
	return false;
});

// Fetch all posts by this author
const { data: allPosts } = await useAsyncData<BlogCollectionItem[]>(
	`author-posts-${authorId.value}`,
	() => queryCollection("blog").order("date", "DESC").all()
);

const authorPosts = computed(() => {
	return (allPosts.value ?? []).filter(
		(post) => post.author === authorId.value
	);
});

function getPostPath(post: BlogCollectionItem): string {
	if (post.path && post.path !== "/blog") return post.path;
	if (post.stem) return `/${post.stem}`;
	if (post.id) {
		const derivedStem = post.id.replace(/^blog\//, "").replace(/\.md$/, "");
		return `/${derivedStem}`;
	}
	return post.path ?? "/blog";
}

function fallbackAvatar(label: string, size = 120) {
	const initial = (label?.trim()?.[0] ?? "A").toUpperCase();
	return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${initial}`;
}

const authorDisplayName = computed(() => authorRecord.value?.name ?? authorId.value);

const avatar = computed(() => {
	return authorRecord.value?.avatar ?? fallbackAvatar(authorDisplayName.value);
});

const bannerUrl = computed(() => {
	return authorRecord.value?.banner ?? null;
});

// Post stats
const totalPosts = computed(() => authorPosts.value.length);

// Popular tags for this author
const authorTags = computed(() => {
	const tagCounts = new Map<string, number>();
	authorPosts.value.forEach((post) => {
		if (Array.isArray(post.tags)) {
			post.tags.forEach((tag) => {
				tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
			});
		}
	});
	return Array.from(tagCounts.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
});

// Series this author participates in
const authorSeries = computed(() => {
	const seriesCounts = new Map<string, number>();
	authorPosts.value.forEach((post) => {
		if (Array.isArray(post.series)) {
			post.series.forEach((s: string) => {
				seriesCounts.set(s, (seriesCounts.get(s) || 0) + 1);
			});
		}
	});
	return Array.from(seriesCounts.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
});

// Tab state
const activeTab = ref<'posts' | 'readme'>('posts');

// Sorting
type SortMode = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';
const sortMode = ref<SortMode>('date-desc');

const sortedPosts = computed(() => {
	const posts = [...authorPosts.value];
	switch (sortMode.value) {
		case 'date-desc':
			return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		case 'date-asc':
			return posts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		case 'name-asc':
			return posts.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'zh-TW'));
		case 'name-desc':
			return posts.sort((a, b) => (b.title ?? '').localeCompare(a.title ?? '', 'zh-TW'));
		default:
			return posts;
	}
});

useHead({
	title: `${authorDisplayName.value} - 作者 - 星谷雜貨店`,
});
</script>

<template>
	<div class="author-page">
		<!-- Banner -->
		<div class="banner-section">
			<div v-if="bannerUrl" class="banner-image">
				<img :src="bannerUrl" :alt="`${authorDisplayName} banner`">
			</div>
			<div v-else class="banner-default">
				<div class="banner-pattern" />
			</div>
		</div>

		<!-- Main layout: Profile LEFT, Content RIGHT -->
		<div class="author-layout">
			<!-- Left column: Profile sidebar -->
			<aside class="profile-column">
				<div class="profile-card">
					<!-- Avatar -->
					<div class="profile-avatar-wrap">
						<img :src="avatar" :alt="authorDisplayName" class="profile-avatar">
					</div>

					<h1 class="profile-name">{{ authorDisplayName }}</h1>
					<p v-if="authorRecord?.bio" class="profile-bio">
						{{ authorRecord.bio }}
					</p>

					<!-- Stats -->
					<div class="profile-stats">
						<div class="stat-item">
							<Icon name="heroicons:document-text" size="16" class="stat-icon" />
							<span class="stat-value">{{ totalPosts }}</span>
							<span class="stat-label">文章</span>
						</div>
						<div class="stat-item">
							<Icon name="heroicons:tag" size="16" class="stat-icon" />
							<span class="stat-value">{{ authorTags.length }}</span>
							<span class="stat-label">標籤</span>
						</div>
						<div class="stat-item">
							<Icon name="heroicons:bookmark" size="16" class="stat-icon" />
							<span class="stat-value">{{ authorSeries.length }}</span>
							<span class="stat-label">專欄</span>
						</div>
					</div>

					<!-- Contact & Links -->
					<div v-if="authorRecord?.email || authorRecord?.social" class="profile-links">
						<a
							v-if="authorRecord?.email"
							:href="`mailto:${authorRecord.email}`"
							class="profile-link-item"
						>
							<Icon name="heroicons:envelope" size="16" />
							<span>{{ authorRecord.email }}</span>
						</a>
						<a
							v-if="authorRecord?.social?.website"
							:href="authorRecord.social.website"
							target="_blank"
							rel="noopener"
							class="profile-link-item"
						>
							<Icon name="heroicons:link" size="16" />
							<span>{{ authorRecord.social.website.replace(/^https?:\/\//, '') }}</span>
						</a>
						<a
							v-if="authorRecord?.social?.github"
							:href="authorRecord.social.github"
							target="_blank"
							rel="noopener"
							class="profile-link-item"
						>
							<Icon name="mdi:github" size="16" />
							<span>GitHub</span>
						</a>
						<a
							v-if="authorRecord?.social?.twitter && authorRecord.social.twitter !== ''"
							:href="authorRecord.social.twitter"
							target="_blank"
							rel="noopener"
							class="profile-link-item"
						>
							<Icon name="mdi:twitter" size="16" />
							<span>Twitter</span>
						</a>
					</div>
				</div>

				<!-- Popular Tags box -->
				<div v-if="authorTags.length > 0" class="sidebar-box">
					<h3 class="sidebar-box-title">常用標籤</h3>
					<div class="tag-cloud">
						<NuxtLink
							v-for="tag in authorTags.slice(0, 10)"
							:key="tag.name"
							:to="`/?tag=${encodeURIComponent(tag.name)}&author=${encodeURIComponent(authorId)}`"
							class="tag-cloud-item"
						>
							#{{ tag.name }}
							<span class="tag-cloud-count">{{ tag.count }}</span>
						</NuxtLink>
					</div>
				</div>

				<!-- Series box -->
				<div v-if="authorSeries.length > 0" class="sidebar-box">
					<h3 class="sidebar-box-title">參與專欄</h3>
					<div class="series-list">
						<NuxtLink
							v-for="s in authorSeries"
							:key="s.name"
							:to="`/series/${encodeURIComponent(s.name)}`"
							class="series-list-item"
						>
							<Icon name="heroicons:bookmark-square" size="16" />
							<span class="series-list-name">{{ s.name }}</span>
							<span class="series-list-count">{{ s.count }} 篇</span>
						</NuxtLink>
					</div>
				</div>
			</aside>

			<!-- Right column: Tabs + Content -->
			<main class="content-column">
				<!-- Tab header -->
				<div class="tab-bar">
					<button
						class="tab-button"
						:class="{ active: activeTab === 'posts' }"
						@click="activeTab = 'posts'"
					>
						<Icon name="heroicons:newspaper" size="18" />
						文章
						<span class="tab-count">{{ totalPosts }}</span>
					</button>
					<button
						class="tab-button"
						:class="{ active: activeTab === 'readme' }"
						@click="activeTab = 'readme'"
					>
						<Icon name="heroicons:document-text" size="18" />
						README
					</button>
				</div>

				<!-- Posts tab -->
				<div v-show="activeTab === 'posts'" class="tab-content">
					<!-- Sort controls -->
					<div v-if="authorPosts.length > 1" class="sort-bar">
						<span class="sort-label">
							<Icon name="heroicons:arrows-up-down" size="16" />
							排序：
						</span>
						<select v-model="sortMode" class="sort-select">
							<option value="date-desc">日期（新到舊）</option>
							<option value="date-asc">日期（舊到新）</option>
							<option value="name-asc">標題（A→Z）</option>
							<option value="name-desc">標題（Z→A）</option>
						</select>
					</div>

					<div v-if="sortedPosts.length > 0" class="posts-list">
						<article
							v-for="post in sortedPosts"
							:key="post.id"
							class="post-card"
						>
							<NuxtLink :to="getPostPath(post)" class="post-link">
								<div v-if="post.featured_image" class="post-image">
									<img :src="post.featured_image" :alt="post.title">
								</div>
							</NuxtLink>
							<div class="post-body">
								<NuxtLink :to="getPostPath(post)" class="post-title-link">
									<h3 class="post-title">{{ post.title }}</h3>
								</NuxtLink>
								<p v-if="post.description" class="post-description">
									{{ post.description }}
								</p>
								<div class="post-meta">
									<span class="post-date">
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
										class="post-tags"
									>
										<span
											v-for="tag in post.tags.slice(0, 3)"
											:key="tag"
											class="tag-chip"
										>
											#{{ tag }}
										</span>
									</div>
									<div
										v-if="Array.isArray(post.series) && post.series.length"
										class="post-series-badges"
									>
										<NuxtLink
											v-for="s in post.series"
											:key="s"
											:to="`/series/${encodeURIComponent(s)}`"
											class="series-chip"
										>
											<Icon name="heroicons:bookmark" size="12" />
											{{ s }}
										</NuxtLink>
									</div>
								</div>
							</div>
						</article>
					</div>

					<div v-else class="empty-state">
						<Icon name="heroicons:document-magnifying-glass" size="48" />
						<p>此作者還沒有發表文章。</p>
					</div>
				</div>

				<!-- README tab -->
				<div v-show="activeTab === 'readme'" class="tab-content">
					<div v-if="hasReadme && authorPage" class="readme-content">
						<div class="readme-card">
							<div class="readme-header">
								<img :src="avatar" :alt="authorDisplayName" class="readme-avatar">
								<span class="readme-filename">{{ authorDisplayName }} / README.md</span>
							</div>
							<div class="readme-body nuxt-content">
								<ContentRenderer :value="authorPage">
									<ContentRendererMarkdown :value="authorPage" />
								</ContentRenderer>
							</div>
						</div>
					</div>
					<div v-else class="empty-state">
						<Icon name="heroicons:document-text" size="48" />
						<p>此作者還沒有撰寫自我介紹。</p>
					</div>
				</div>
			</main>
		</div>
	</div>
</template>

<style scoped>
.author-page {
	max-width: 1100px;
	margin: 0 auto;
	padding: 0;
}

/* ===== Banner ===== */
.banner-section {
	width: 100%;
	height: 200px;
	border-radius: 0 0 16px 16px;
	overflow: hidden;
	position: relative;
}

.banner-image {
	width: 100%;
	height: 100%;
}

.banner-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.banner-default {
	width: 100%;
	height: 100%;
	background: linear-gradient(
		135deg,
		color-mix(in srgb, var(--color-primary) 30%, var(--color-bg-tertiary)) 0%,
		color-mix(in srgb, var(--color-accent) 20%, var(--color-bg-tertiary)) 50%,
		color-mix(in srgb, var(--color-primary-light) 25%, var(--color-bg-tertiary)) 100%
	);
	position: relative;
}

.banner-pattern {
	position: absolute;
	inset: 0;
	background-image:
		radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--color-primary) 15%, transparent) 0%, transparent 50%),
		radial-gradient(circle at 80% 30%, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 50%);
}

/* ===== Main layout ===== */
.author-layout {
	display: grid;
	grid-template-columns: 300px minmax(0, 1fr);
	gap: 2rem;
	align-items: start;
	padding-top: 1.25rem;
}

/* ===== Profile sidebar (Left) ===== */
.profile-column {
	position: sticky;
	top: calc(var(--header-height) + 1.5rem);
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
}

.profile-card {
	background: var(--panel-bg);
	border: 1px solid var(--color-border-light);
	border-radius: 14px;
	padding: 0 1.25rem 1.25rem;
	box-shadow: var(--shadow-sm);
	backdrop-filter: saturate(1.08) blur(var(--glass-blur));
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.6rem;
}

/* Avatar overlapping banner */
.profile-avatar-wrap {
	width: 96px;
	height: 96px;
	border-radius: 50%;
	overflow: hidden;
	border: 4px solid var(--color-bg-primary);
	box-shadow: 0 0 0 2px var(--color-primary);
	margin-top: -48px;
	flex-shrink: 0;
	background: var(--color-bg-primary);
}

.profile-avatar {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.profile-name {
	font-size: 1.4rem;
	font-weight: 700;
	color: var(--color-text-primary);
	margin: 0;
	text-align: center;
}

.profile-bio {
	font-size: 0.9rem;
	color: var(--color-text-secondary);
	line-height: 1.6;
	margin: 0;
	text-align: center;
}

/* Stats row */
.profile-stats {
	display: flex;
	gap: 1.25rem;
	padding: 0.75rem 0;
	border-top: 1px solid var(--color-border-light);
	border-bottom: 1px solid var(--color-border-light);
	width: 100%;
	justify-content: center;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 0.3rem;
	font-size: 0.85rem;
	color: var(--color-text-secondary);
}

.stat-icon {
	color: var(--color-text-tertiary);
}

.stat-value {
	font-weight: 700;
	color: var(--color-text-primary);
}

.stat-label {
	color: var(--color-text-tertiary);
}

/* Links section */
.profile-links {
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
	width: 100%;
}

.profile-link-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.4rem 0.6rem;
	border-radius: 8px;
	font-size: 0.85rem;
	color: var(--color-text-secondary);
	text-decoration: none;
	transition: all 0.15s ease;
}

.profile-link-item:hover {
	background: color-mix(in srgb, var(--color-primary-light) 12%, transparent);
	color: var(--color-primary-dark);
}

.profile-link-item :deep(svg) {
	color: var(--color-text-tertiary);
	flex-shrink: 0;
}

.profile-link-item:hover :deep(svg) {
	color: var(--color-primary);
}

.profile-link-item span {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* Sidebar boxes (tags, series) */
.sidebar-box {
	background: var(--panel-bg);
	border: 1px solid var(--color-border-light);
	border-radius: 14px;
	padding: 1rem 1.25rem;
	box-shadow: var(--shadow-sm);
	backdrop-filter: saturate(1.08) blur(var(--glass-blur));
}

.sidebar-box-title {
	margin: 0 0 0.65rem;
	font-size: 0.95rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	color: var(--color-text-secondary);
	padding-left: 0.5rem;
	border-left: 3px solid var(--color-primary);
}

/* Tag cloud */
.tag-cloud {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
}

.tag-cloud-item {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	font-size: 0.8rem;
	color: var(--color-text-secondary);
	background: color-mix(in srgb, var(--color-bg-secondary) 70%, transparent);
	border: 1px solid var(--color-border-light);
	padding: 0.2rem 0.55rem;
	border-radius: 999px;
	text-decoration: none;
	transition: all 0.15s ease;
}

.tag-cloud-item:hover {
	color: var(--color-primary-dark);
	border-color: var(--color-primary-light);
	background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.tag-cloud-count {
	font-size: 0.7rem;
	font-weight: 700;
	color: var(--color-text-tertiary);
}

/* Series list */
.series-list {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.series-list-item {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.45rem 0.55rem;
	border-radius: 8px;
	text-decoration: none;
	color: var(--color-text-secondary);
	font-size: 0.85rem;
	transition: all 0.15s ease;
}

.series-list-item:hover {
	background: color-mix(in srgb, var(--color-primary-light) 12%, transparent);
	color: var(--color-primary-dark);
}

.series-list-item :deep(svg) {
	color: var(--color-primary);
	flex-shrink: 0;
}

.series-list-name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.series-list-count {
	font-size: 0.75rem;
	color: var(--color-text-tertiary);
	flex-shrink: 0;
}

/* ===== Content column (Right) ===== */
.content-column {
	min-width: 0;
}

/* Tab bar */
.tab-bar {
	display: flex;
	gap: 0;
	border-bottom: 2px solid var(--color-border-light);
	margin-bottom: 1.25rem;
}

.tab-button {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.75rem 1.25rem;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--color-text-tertiary);
	background: none;
	border: none;
	cursor: pointer;
	border-bottom: 2px solid transparent;
	margin-bottom: -2px;
	transition: all 0.2s ease;
}

.tab-button:hover {
	color: var(--color-text-primary);
	background: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
}

.tab-button.active {
	color: var(--color-text-primary);
	border-bottom-color: var(--color-primary);
}

.tab-button.active :deep(svg) {
	color: var(--color-primary);
}

.tab-count {
	font-size: 0.78rem;
	font-weight: 700;
	background: color-mix(in srgb, var(--color-bg-secondary) 80%, transparent);
	border: 1px solid var(--color-border-light);
	padding: 0.1rem 0.45rem;
	border-radius: 999px;
	color: var(--color-text-tertiary);
}

.tab-button.active .tab-count {
	background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
	color: var(--color-primary-dark);
}

/* Sort bar */
.sort-bar {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	padding: 0.5rem 0.75rem;
	background: var(--panel-bg);
	border: 1px solid var(--color-border-light);
	border-radius: 10px;
	backdrop-filter: saturate(1.08) blur(var(--glass-blur));
}

.sort-label {
	display: flex;
	align-items: center;
	gap: 0.3rem;
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--color-text-tertiary);
	white-space: nowrap;
}

.sort-select {
	font-size: 0.85rem;
	font-weight: 500;
	color: var(--color-text-primary);
	background: color-mix(in srgb, var(--color-bg-primary) 80%, transparent);
	border: 1px solid var(--color-border-light);
	border-radius: 8px;
	padding: 0.35rem 0.65rem;
	cursor: pointer;
	outline: none;
	transition: border-color 0.2s;
}

.sort-select:focus {
	border-color: var(--color-primary);
}

/* ===== Posts tab ===== */
.posts-list {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.post-card {
	display: flex;
	flex-direction: column;
	background: var(--panel-bg);
	border: 1px solid var(--color-border-light);
	border-radius: 12px;
	overflow: hidden;
	transition: all 0.3s ease;
	box-shadow: var(--shadow-sm);
	backdrop-filter: saturate(1.08) blur(var(--glass-blur));
}

.post-card:hover {
	transform: translateY(-3px);
	box-shadow: var(--shadow-md);
	border-color: var(--color-primary-light);
}

.post-link {
	text-decoration: none;
	color: inherit;
	display: block;
}

.post-image {
	width: 100%;
	height: 180px;
	overflow: hidden;
	background: var(--color-bg-tertiary);
}

.post-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.post-card:hover .post-image img {
	transform: scale(1.05);
}

.post-body {
	padding: 1.2rem 1.35rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.post-title-link {
	text-decoration: none;
	color: inherit;
	width: fit-content;
}

.post-title {
	font-size: 1.2rem;
	font-weight: 600;
	color: var(--color-text-primary);
	margin: 0;
	line-height: 1.4;
}

.post-card:hover .post-title {
	color: var(--color-primary-dark);
}

.post-description {
	font-size: 0.92rem;
	color: var(--color-text-secondary);
	line-height: 1.6;
	margin: 0;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.post-meta {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	flex-wrap: wrap;
	margin-top: 0.25rem;
}

.post-date {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.82rem;
	color: var(--color-text-tertiary);
}

.post-tags {
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

.post-series-badges {
	display: flex;
	gap: 0.3rem;
}

.series-chip {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	font-size: 0.78rem;
	color: var(--color-primary-dark);
	background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
	padding: 0.12rem 0.5rem;
	border-radius: 999px;
	text-decoration: none;
	transition: all 0.2s ease;
}

.series-chip:hover {
	background: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

/* ===== README tab ===== */
.readme-content {
	padding: 0;
}

.readme-card {
	background: var(--panel-bg);
	border: 1px solid var(--color-border-light);
	border-radius: 12px;
	overflow: hidden;
	box-shadow: var(--shadow-sm);
	backdrop-filter: saturate(1.08) blur(var(--glass-blur));
}

.readme-header {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.75rem 1.25rem;
	border-bottom: 1px solid var(--color-border-light);
	background: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
}

.readme-avatar {
	width: 22px;
	height: 22px;
	border-radius: 50%;
	object-fit: cover;
}

.readme-filename {
	font-size: 0.88rem;
	font-weight: 600;
	color: var(--color-text-primary);
}

.readme-body {
	padding: 1.5rem;
	font-size: 1rem;
	line-height: 1.8;
	color: var(--color-text-primary);
}

.readme-body :deep(h2) {
	font-size: 1.5rem;
	margin-top: 1.5rem;
	margin-bottom: 0.75rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid var(--color-border-light);
	color: var(--color-text-primary);
}

.readme-body :deep(h2:first-child) {
	margin-top: 0;
}

.readme-body :deep(h3) {
	font-size: 1.2rem;
	margin-top: 1.25rem;
	margin-bottom: 0.5rem;
	color: var(--color-text-primary);
}

.readme-body :deep(p) {
	margin-bottom: 1rem;
}

.readme-body :deep(ul) {
	padding-left: 1.5rem;
	margin-bottom: 1rem;
}

.readme-body :deep(li) {
	margin-bottom: 0.35rem;
}

.readme-body :deep(a) {
	color: var(--color-primary-dark);
	text-decoration: underline;
	text-underline-offset: 3px;
}

.readme-body :deep(blockquote) {
	border-left: 4px solid var(--color-accent);
	padding: 0.75rem 1rem;
	margin: 1rem 0;
	font-style: italic;
	color: var(--color-text-secondary);
	background: var(--color-bg-secondary);
	border-radius: 0 8px 8px 0;
}

.readme-body :deep(del) {
	color: var(--color-text-tertiary);
}

/* ===== Empty states ===== */
.empty-state {
	text-align: center;
	padding: 4rem 1rem;
	color: var(--color-text-tertiary);
}

.empty-state :deep(svg) {
	color: var(--color-border-medium);
	margin-bottom: 1rem;
}

/* ===== Responsive ===== */
@media (max-width: 960px) {
	.banner-section {
		height: 160px;
		border-radius: 0;
	}

	.author-layout {
		grid-template-columns: 1fr;
		padding-top: 0.75rem;
	}

	.profile-column {
		position: static;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.profile-card {
		grid-column: 1 / -1;
		flex-direction: row;
		flex-wrap: wrap;
		padding: 0 1.25rem 1.25rem;
		gap: 0.4rem 1rem;
	}

	.profile-avatar-wrap {
		width: 72px;
		height: 72px;
		margin-top: -36px;
	}

	.profile-name {
		font-size: 1.2rem;
		width: 100%;
		text-align: left;
	}

	.profile-bio {
		width: 100%;
		text-align: left;
	}

	.profile-stats {
		justify-content: flex-start;
	}

	.profile-links {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
}

@media (max-width: 768px) {
	.banner-section {
		height: 140px;
	}

	.author-page {
		padding: 0;
	}

	.profile-column {
		grid-template-columns: 1fr;
	}

	.tab-button {
		padding: 0.6rem 0.85rem;
		font-size: 0.88rem;
	}

	.post-image {
		height: 150px;
	}

	.sort-bar {
		flex-wrap: wrap;
	}
}

@media (max-width: 480px) {
	.banner-section {
		height: 120px;
	}

	.profile-avatar-wrap {
		width: 64px;
		height: 64px;
		margin-top: -32px;
	}

	.profile-name {
		font-size: 1.1rem;
	}

	.post-body {
		padding: 1rem;
	}

	.post-title {
		font-size: 1.05rem;
	}

	.readme-body {
		padding: 1rem;
		font-size: 0.92rem;
	}
}
</style>
