<script setup lang="ts">
import type { BlogCollectionItem } from "@nuxt/content";
import { useTheme } from '#imports';

const { theme } = useTheme();

const heroImageSrc = computed(() => 
	theme.value === 'dark' ? '/images/background_dark.jpg' : '/images/background_light.jpg'
);

type AuthorCollectionItem = {
	name?: string;
	bio?: string;
	avatar?: string;
	[key: string]: unknown;
};

type DisplayPost = BlogCollectionItem & {
	path: string;
	authorAvatar?: string;
	authorBio?: string;
};

const route = useRoute();
const fullDescription =
	"我們是一群認識的小夥伴。這裡收錄大家的日常冒險、靈感筆記和生活記錄。";

const { data: posts } = await useAsyncData<BlogCollectionItem[]>("posts", () =>
	queryCollection("blog").order("date", "DESC").all()
);

const { data: authors } = await useAsyncData("authors", () =>
	queryCollection("authors").all()
);

const authorDirectory = computed<Record<string, AuthorCollectionItem>>(() => {
	const directory: Record<string, AuthorCollectionItem> = {};
	const records = (authors.value ?? []) as unknown as AuthorCollectionItem[];
	records.forEach((entry) => {
		if (entry?.name) {
			directory[entry.name] = entry;
		}
	});
	return directory;
});

function fallbackAvatar(label: string, size = 64) {
	const safeLabel = label?.trim();
	const initial = (safeLabel ? safeLabel[0] : "A")?.toUpperCase() ?? "A";
	return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${initial}`;
}

function enrichPost(post: BlogCollectionItem, path: string): DisplayPost {
	const profile = post.author ? authorDirectory.value[post.author] : undefined;
	return {
		...post,
		path,
		authorAvatar:
			profile?.avatar ??
			(post.author ? fallbackAvatar(post.author, 56) : undefined),
		authorBio: profile?.bio,
	};
}

const preparedPosts = computed<DisplayPost[]>(() => {
	const rawPosts = posts.value ?? [];
	return rawPosts.map((post) => {
		if (post.path && post.path !== "/blog") {
			return enrichPost(post, post.path);
		}

		if (post.stem) {
			return enrichPost(post, `/${post.stem}`);
		}

		if (post.id) {
			const derivedStem = post.id
				.replace(/^blog\//, "")
				.replace(/\.md$/, "");
			return enrichPost(post, `/${derivedStem}`);
		}

		return enrichPost(post, post.path ?? "/blog");
	});
});

const searchQuery = inject("searchQuery", ref(""));

const tagFilter = computed(() => route.query.tag as string | undefined);
const yearFilter = computed(() => route.query.year as string | undefined);
const authorFilter = computed(() => route.query.author as string | undefined);
const categoryFilter = computed(
	() => route.query.category as string | undefined
);

const filteredPosts = computed<DisplayPost[]>(() => {
	let filtered = preparedPosts.value || [];

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter(
			(post) =>
				post.title?.toLowerCase().includes(query) ||
				post.description?.toLowerCase().includes(query)
		);
	}

	if (tagFilter.value) {
		filtered = filtered.filter(
			(post) =>
				Array.isArray(post.tags) &&
				post.tags.includes(tagFilter.value as string)
		);
	}

	if (yearFilter.value) {
		filtered = filtered.filter((post) => {
			const year = new Date(post.date).getFullYear().toString();
			return year === yearFilter.value;
		});
	}

	if (authorFilter.value) {
		filtered = filtered.filter((post) => post.author === authorFilter.value);
	}

	if (categoryFilter.value) {
		filtered = filtered.filter((post) => post.category === categoryFilter.value);
	}

	return filtered;
});

const activeFilter = computed(() => {
	if (tagFilter.value) return `標籤：${tagFilter.value}`;
	if (yearFilter.value) return `年份：${yearFilter.value}`;
	if (authorFilter.value) return `作者：${authorFilter.value}`;
	if (categoryFilter.value) return `分類：${categoryFilter.value}`;
	return null;
});

const totalPosts = computed(() => preparedPosts.value.length);

const totalTags = computed(() => {
	const tags = new Set<string>();
	preparedPosts.value.forEach((post) => {
		if (Array.isArray(post.tags)) {
			post.tags.forEach((tag) => tags.add(tag));
		}
	});
	return tags.size;
});

const totalCategories = computed(() => {
	const categories = new Set<string>();
	preparedPosts.value.forEach((post) => {
		if (post.category) {
			categories.add(post.category);
		}
	});
	return categories.size;
});

const latestYear = computed(() => {
	const firstPost = preparedPosts.value[0];
	if (!firstPost?.date) return new Date().getFullYear().toString();
	return new Date(firstPost.date).getFullYear().toString();
});

const sidebarAuthors = computed(() => {
	const authorCounts = new Map<string, number>();

	preparedPosts.value.forEach((post) => {
		if (post.author) {
			authorCounts.set(post.author, (authorCounts.get(post.author) || 0) + 1);
		}
	});

	return Array.from(authorCounts.entries())
		.map(([name, count]) => ({
			name,
			count,
			avatar: authorDirectory.value[name]?.avatar ?? fallbackAvatar(name, 44),
		}))
		.sort((a, b) => b.count - a.count);
});

const typedDescription = ref("");
const isTypingDone = ref(false);
const scrollProgress = ref(0);
let typingTimer: ReturnType<typeof setInterval> | null = null;

const heroStyle = computed(() => {
	const blur = Math.min(13, scrollProgress.value * 13);
	const dim = 0.1 + scrollProgress.value * 0.14;
	const opacity = 1 - scrollProgress.value * 0.18;
	return {
		"--hero-blur": `${blur}px`,
		"--hero-dim": `${dim}`,
		"--hero-opacity": `${opacity}`,
	};
});

const updateScrollProgress = () => {
	if (typeof window === "undefined") return;
	const maxRange = Math.max(window.innerHeight * 0.95, 1);
	scrollProgress.value = Math.min(window.scrollY / maxRange, 1);
};

const scrollToPosts = () => {
	const section = document.getElementById("posts-list");
	if (!section) return;
	section.scrollIntoView({ behavior: "smooth", block: "start" });
};

onMounted(() => {
	let isDeleting = false;
	const typeSpeed = 100;
	const deleteSpeed = 50;
	const pauseEnd = 2000;
	const pauseStart = 500;

	const typeLoop = () => {
		const currentText = typedDescription.value;
		const fullText = fullDescription;

		if (isDeleting) {
			if (currentText.length > 0) {
				typedDescription.value = currentText.slice(0, -1);
				typingTimer = setTimeout(typeLoop, deleteSpeed);
			} else {
				isDeleting = false;
				typingTimer = setTimeout(typeLoop, pauseStart);
			}
		} else {
			if (currentText.length < fullText.length) {
				typedDescription.value = fullText.slice(0, currentText.length + 1);
				typingTimer = setTimeout(typeLoop, typeSpeed + Math.random() * 50);
			} else {
				isDeleting = true;
				isTypingDone.value = true;
				typingTimer = setTimeout(() => {
					isTypingDone.value = false;
					typeLoop();
				}, pauseEnd);
			}
		}
	};

	// Start typing loop
	typingTimer = setTimeout(typeLoop, 500);

	updateScrollProgress();
	window.addEventListener("scroll", updateScrollProgress, { passive: true });
	window.addEventListener("resize", updateScrollProgress);
});

onBeforeUnmount(() => {
	if (typingTimer) {
		clearTimeout(typingTimer);
		typingTimer = null;
	}
	window.removeEventListener("scroll", updateScrollProgress);
	window.removeEventListener("resize", updateScrollProgress);
});

</script>


<template>
	<div class="home-page" :style="heroStyle">

		<div class="hero-background" aria-hidden="true">
			<!-- Dual images for smooth fade -->
			<img 
				src="/images/background_light.jpg" 
				alt="" 
				class="hero-image light-mode"
				:class="{ active: theme === 'light' }"
			>
			<img 
				src="/images/background_dark.jpg" 
				alt="" 
				class="hero-image dark-mode"
				:class="{ active: theme === 'dark' }"
			>
			<div class="hero-background-mask" />
		</div>

		<section class="welcome-screen">
			<div class="welcome-content">
				<h1 class="welcome-title">七糯糯的小站</h1>
				<p class="typing-line" :class="{ finished: isTypingDone }">
					{{ typedDescription }}
				</p>
			</div>

			<button type="button" class="scroll-indicator" @click="scrollToPosts">
				<Icon name="heroicons:chevron-down" size="24" />
				<span>向下捲動閱讀文章</span>
			</button>
		</section>

		<section id="posts-list" class="blog-section">
			<div class="blog-layout">
				<aside class="home-sidebar">
					<div class="sidebar-box">
						<div class="sidebar-profile">
							<img
								src="/images/uploads/103467998_p0 copy.png"
								alt="七糯糯的小站"
								class="site-avatar"
							>
							<h2 class="site-name">七糯糯的小站</h2>
							<p class="site-motto">分享生活點滴的小小天地。</p>
						</div>
					</div>

					<div class="sidebar-box">
						<h3 class="sidebar-box-title">資料概覽</h3>
						<div class="sidebar-stats">
							<div class="stat-box">
								<span class="stat-value">{{ totalPosts }}</span>
								<span class="stat-label">文章</span>
							</div>
							<div class="stat-box">
								<span class="stat-value">{{ totalTags }}</span>
								<span class="stat-label">標籤</span>
							</div>
							<div class="stat-box">
								<span class="stat-value">{{ totalCategories }}</span>
								<span class="stat-label">分類</span>
							</div>
						</div>
					</div>

					<div class="sidebar-box">
						<h3 class="sidebar-box-title">快速入口</h3>
						<div class="quick-links">
							<NuxtLink :to="`/?year=${latestYear}`" class="quick-link-button">
								<Icon name="heroicons:archive-box" size="16" />
								歸檔
							</NuxtLink>
							<a
								href="https://github.com/ChinHongTan/blog"
								target="_blank"
								rel="noopener noreferrer"
								class="quick-link-button"
							>
								<Icon name="heroicons:link" size="16" />
								連結
							</a>
						</div>
					</div>

					<div v-if="sidebarAuthors.length" class="sidebar-box author-panel">
						<h3 class="sidebar-box-title">作者</h3>

						<div class="authors-list">
							<NuxtLink
								v-for="author in sidebarAuthors"
								:key="author.name"
								:to="`/?author=${encodeURIComponent(author.name)}`"
								class="author-row"
							>
								<img :src="author.avatar" :alt="author.name" class="author-avatar">
								<span class="author-name">{{ author.name }}</span>
								<span class="author-count">{{ author.count }}</span>
							</NuxtLink>
						</div>

						<div class="authors-grid" aria-label="作者列表">
							<NuxtLink
								v-for="author in sidebarAuthors"
								:key="`${author.name}-grid`"
								:to="`/?author=${encodeURIComponent(author.name)}`"
								class="author-grid-item"
							>
								<img :src="author.avatar" :alt="author.name" class="author-avatar">
							</NuxtLink>
						</div>
					</div>
				</aside>

				<section class="posts-column">
					<div class="section-header">
						<h2 class="section-heading">
							<Icon name="heroicons:newspaper" size="26" />
							最近更新
						</h2>

						<div v-if="activeFilter" class="filter-badge">
							<span>{{ activeFilter }}</span>
							<NuxtLink to="/" class="clear-filter">
								<Icon name="heroicons:x-mark" size="16" />
							</NuxtLink>
						</div>
					</div>

					<div v-if="filteredPosts.length > 0" class="posts-grid">
						<article
							v-for="post in filteredPosts"
							:key="post.id"
							class="post-card"
						>
							<NuxtLink :to="post.path" class="post-main-link">
								<div v-if="post.featured_image" class="post-image">
									<img :src="post.featured_image" :alt="post.title">
								</div>
							</NuxtLink>
							<div class="post-content">
								<NuxtLink :to="post.path" class="post-main-link title-link">
									<h3 class="post-title">{{ post.title }}</h3>
								</NuxtLink>
								<p v-if="post.description" class="post-description">
									{{ post.description }}
								</p>
								<div class="post-meta-row">
									<div class="post-meta-main">
										<template v-if="post.author">
											<img
												:src="post.authorAvatar || fallbackAvatar(post.author, 32)"
												:alt="post.author"
												class="post-author-avatar"
											>
										</template>
										<div class="post-meta-text">
											<NuxtLink
												v-if="post.author"
												:to="`/?author=${encodeURIComponent(post.author)}`"
												class="post-author-link"
											>
												<span class="post-author-name">{{ post.author }}</span>
											</NuxtLink>
											<span class="meta-item post-date">
												<Icon name="heroicons:calendar-days" size="15" class="meta-icon" />
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
												class="tags-group"
											>
												<Icon name="heroicons:tag" size="15" class="meta-icon" />
												<NuxtLink
													v-for="tag in post.tags"
													:key="`${post.id}-${tag}`"
													:to="`/?tag=${encodeURIComponent(tag)}`"
													class="post-tag-link"
												>
													#{{ tag }}
												</NuxtLink>
											</div>
										</div>
									</div>
									<NuxtLink :to="post.path" class="post-readmore">
										<span>閱讀更多</span>
										<Icon name="heroicons:chevron-right" size="16" />
									</NuxtLink>
								</div>
							</div>
						</article>
					</div>

					<div v-else class="no-results">
						<Icon name="heroicons:magnifying-glass-circle" size="48" />
						<p>找不到相關內容。試試其他搜尋！</p>
					</div>
				</section>
			</div>
		</section>
	</div>
</template>

<style scoped>
.home-page {
	--hero-blur: 0px;
	--hero-dim: 0.1;
	--hero-opacity: 1;
	position: relative;
	margin: -3rem -2rem 0;
	isolation: isolate;
}

.hero-background {
	position: fixed;
	inset: 0 0 auto 0;
	height: 100vh;
	z-index: 0;
	overflow: hidden;
	opacity: var(--hero-opacity);
}

/* Hero Images transition using opacity */
.hero-image {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	filter: blur(var(--hero-blur));
	transform: scale(calc(1 + (var(--hero-blur) / 130)));
	transition: filter 0.18s linear, transform 0.2s ease, opacity 0.6s ease;
	opacity: 0;
}

.hero-image.active {
	opacity: 1;
}

.hero-background-mask {
	position: absolute;
	inset: 0;
	background:
		linear-gradient(
			180deg,
			rgba(10, 15, 28, calc(var(--hero-dim) + 0.03)) 0%,
			rgba(5, 10, 20, calc(var(--hero-dim) + 0.14)) 100%
		),
		radial-gradient(
			circle at 50% 70%,
			rgba(57, 123, 238, 0.06),
			rgba(12, 17, 30, 0.12) 60%,
			rgba(7, 10, 19, 0.18)
		);
}

.welcome-screen,
.blog-section {
	position: relative;
	z-index: 1;
}

.welcome-screen {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 3rem 2rem;
	gap: 2.2rem;
}

.welcome-content {
	max-width: 880px;
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.welcome-title {
	margin: 0;
	font-size: clamp(2rem, 6vw, 4.35rem);
	font-weight: 800;
	line-height: 1.08;
	letter-spacing: 0.02em;
	color: #f7fbff;
	text-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.typing-line {
	margin: 0;
	font-size: clamp(1rem, 2vw, 1.35rem);
	line-height: 1.8;
	min-height: 2.2em;
	color: #e6eef9;
	text-shadow: 0 6px 18px rgba(0, 0, 0, 0.38);
}

.typing-line::after {
	content: "";
	display: inline-block;
	width: 1px;
	height: 1.1em;
	background: #f8fcff;
	margin-left: 0.25rem;
	animation: blink 1s step-end infinite;
	vertical-align: text-bottom;
}

.typing-line.finished::after {
	opacity: 0;
}

.scroll-indicator {
	border: none;
	background: transparent;
	color: #e6eef9;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	cursor: pointer;
	font-size: 0.92rem;
	text-shadow: 0 5px 16px rgba(0, 0, 0, 0.4);
	animation: bounce 1.8s infinite;
}

.blog-section {
	background: transparent;
	padding: 2rem 2rem 0;
}

.blog-layout {
	max-width: 1220px;
	margin: 0 auto;
	display: grid;
	grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
	gap: 1.8rem;
}

.home-sidebar {
	position: sticky;
	top: calc(var(--header-height) + 1.25rem);
	height: fit-content;
	display: flex;
	flex-direction: column;
	gap: 0.95rem;
}

.sidebar-box {
	background: var(--panel-bg);
	border: 1px solid var(--color-border-light);
	border-radius: 14px;
	padding: 1rem;
	box-shadow: var(--shadow-sm);
	backdrop-filter: saturate(1.08) blur(var(--glass-blur));
}

.sidebar-box-title {
	margin: 0 0 0.7rem;
	font-size: 1.05rem; /* Increased size (~ +3px) */
	font-weight: 700;
	letter-spacing: 0.04em;
	color: var(--color-text-secondary);
	padding-left: 0.55rem;
	border-left: 3px solid var(--color-primary);
}

.sidebar-profile {
	text-align: center;
}

.site-avatar {
	width: 84px;
	height: 84px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid var(--color-primary-light);
	margin-bottom: 0.6rem;
}

.site-name {
	margin: 0;
	font-size: 1.2rem;
	color: var(--color-text-primary);
}

.site-motto {
	margin: 0.4rem 0 0;
	font-size: 0.9rem;
	line-height: 1.6;
	color: var(--color-text-secondary);
}

.sidebar-stats {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.6rem;
}

.stat-box {
	background: color-mix(in srgb, var(--color-bg-primary) 96%, transparent);
	border: 1px solid var(--color-border-light);
	border-radius: 9px;
	padding: 0.58rem 0.35rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.1rem;
}

.stat-value {
	font-size: 1.1rem;
	font-weight: 700;
	color: var(--color-text-primary);
}

.stat-label {
	font-size: 0.76rem;
	color: var(--color-text-tertiary);
}

.quick-links {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.5rem;
}

.quick-link-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.3rem;
	height: 2rem;
	border-radius: 8px;
	font-size: 0.85rem;
	font-weight: 600;
	text-decoration: none;
	border: 1px solid var(--color-border-light);
	background: color-mix(in srgb, var(--color-bg-primary) 95%, transparent);
	color: var(--color-text-secondary);
	transition: all 0.2s ease;
}

.quick-link-button:hover {
	color: var(--color-primary-dark);
	border-color: var(--color-primary-light);
}

.author-panel {
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
}

.authors-list {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}

.author-row {
	display: grid;
	grid-template-columns: 30px minmax(0, 1fr) auto;
	align-items: center;
	gap: 0.8rem;
	text-decoration: none;
	color: var(--color-text-secondary);
	padding: 0.4rem 0.8rem; /* Reduced vertical padding */
	border-radius: 8px;
	transition: all 0.2s ease;
}

.author-row:hover {
	background: color-mix(in srgb, var(--color-primary-light) 14%, transparent);
	color: var(--color-text-primary);
}

.author-avatar {
	width: 30px;
	height: 30px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--color-border-light);
}

.author-name {
	font-size: 0.86rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.author-count {
	font-size: 0.8rem;
	color: var(--color-text-tertiary);
}

.authors-grid {
	display: none;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	gap: 0.4rem;
}

.author-grid-item {
	display: inline-flex;
	justify-content: center;
	padding: 0.2rem;
	border-radius: 8px;
}

.author-grid-item:hover {
	background: color-mix(in srgb, var(--color-primary-light) 16%, transparent);
}

.posts-column {
	display: flex;
	flex-direction: column;
	gap: 1.15rem;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 0.75rem;
}

/* Post Interaction Animations */

/* Read More Button */
.post-readmore {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--color-primary);
	text-decoration: none;
	transition: all 0.2s ease;
}

.post-readmore:hover {
	color: var(--color-primary-dark);
}

.post-readmore :deep(svg) {
	transition: transform 0.2s ease; /* Transition on base state for smooth return */
}

.post-readmore:hover :deep(svg) {
	transform: translateX(4px);
}

/* Tag Links */
.post-tag-link {
	text-decoration: none;
	background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	padding: 0.1rem 0.5rem;
	border-radius: 4px;
	font-size: 0.85rem;
	color: var(--color-primary);
	transition: all 0.2s ease;
	display: inline-block;
}

.post-tag-link:hover {
	background: color-mix(in srgb, var(--color-primary) 15%, transparent);
	color: var(--color-primary-dark);
	/* Removed transform: translateY(-2px); as requested */
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Author Link */
.post-author-link {
	text-decoration: none;
	transition: opacity 0.2s ease;
}

.post-author-link:hover .post-author-name {
	color: var(--color-primary);
	text-decoration: underline;
	text-underline-offset: 4px;
}

.section-heading {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	font-size: 1.6rem;
	color: var(--color-text-primary);
	margin: 0;
}

.section-heading :deep(svg) {
	color: var(--color-primary);
}

.filter-badge {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.4rem 0.8rem;
	background: var(--color-bg-blue-tint);
	border: 1px solid var(--color-primary-light);
	border-radius: 999px;
	font-size: 0.82rem;
	color: var(--color-primary-dark);
	font-weight: 600;
}

.clear-filter {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	background: var(--color-primary);
	color: white;
	border-radius: 999px;
	text-decoration: none;
}

.posts-grid {
	display: grid;
	gap: 1.65rem;
}

.post-card {
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
}

.post-card:hover {
	transform: translateY(-4px);
	box-shadow: var(--shadow-lg);
	border-color: var(--color-primary-light);
}

.post-main-link {
	text-decoration: none;
	color: inherit;
	display: block;
}

.title-link {
	width: fit-content;
}

.post-image {
	width: 100%;
	height: 200px;
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

.post-content {
	padding: 1.35rem;
	display: flex;
	flex-direction: column;
	flex: 1;
	gap: 0.8rem;
}

.post-title {
	font-size: 1.28rem;
	font-weight: 600;
	color: var(--color-text-primary);
	line-height: 1.4;
	margin: 0;
}

.post-description {
	font-size: 0.95rem;
	color: var(--color-text-secondary);
	line-height: 1.6;
	margin: 0;
}

.post-author-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--color-border-light);
}

.post-author-name {
	font-weight: 600;
	color: var(--color-text-primary);
	font-size: 0.9rem;
}

.post-meta-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	flex-wrap: nowrap;
	gap: 0.5rem;
	margin-top: 0.25rem;
}

.post-meta-main {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
}

.post-meta-text {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 0.55rem;
	font-size: 0.9rem;
	color: var(--color-text-tertiary);
	min-width: 0;
	flex: 1;
}

.meta-item,
.post-author-link,
.tags-group {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
}

.post-date {
	color: var(--color-text-secondary);
}

.meta-icon {
	color: var(--color-text-tertiary);
}

.post-author-link {
	text-decoration: none;
	color: var(--color-text-secondary);
	font-weight: 600;
}

.post-author-link:hover {
	color: var(--color-primary-dark);
}

.tags-group {
	flex-wrap: nowrap;
	flex: 1;
	max-width: 100%;
	overflow-x: auto;
	padding-bottom: 0.1rem;
}

.tags-group {
	scrollbar-width: none;
}

.tags-group::-webkit-scrollbar {
	display: none;
}

.post-tag-link {
	flex: 0 0 auto;
	text-decoration: none;
	color: var(--color-text-tertiary);
	font-size: 0.88rem;
	padding: 0.18rem 0.46rem;
	border-radius: 999px;
	background: color-mix(in srgb, var(--color-bg-secondary) 70%, transparent);
	border: 1px solid var(--color-border-light);
}

.post-tag-link:hover {
	color: var(--color-primary-dark);
	border-color: var(--color-primary-light);
}

.post-readmore {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	width: fit-content;
	margin-top: 0;
	align-self: flex-end;
	font-size: 0.94rem;
	font-weight: 600;
	text-decoration: none;
	color: var(--color-primary-dark);
	padding: 0.2rem 0.45rem;
	border-radius: 8px;
	white-space: nowrap;
}

.post-readmore:hover {
	background: color-mix(in srgb, var(--color-primary-light) 14%, transparent);
}

.no-results {
	text-align: center;
	padding: 3rem 1rem;
	color: var(--color-text-tertiary);
}

.no-results :deep(svg) {
	color: var(--color-border-medium);
	margin-bottom: 1rem;
}

@keyframes blink {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0;
	}
}

@keyframes bounce {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(8px);
	}
}

@media (max-width: 960px) {
	.home-page {
		margin-top: -3rem;
	}

	.blog-layout {
		grid-template-columns: 1fr;
	}

	.home-sidebar {
		position: static;
	}

	.sidebar-box {
		padding: 0.95rem;
	}

	.authors-list {
		display: none;
	}

	.authors-grid {
		display: grid;
	}
}

@media (max-width: 768px) {
	.home-page {
		margin: -1.5rem 0 0;
	}

	.hero-background {
		inset: var(--header-height) 0 auto 0;
		height: calc(100vh - var(--header-height));
	}

	.welcome-screen {
		padding: 2rem 1.15rem;
		gap: 1.6rem;
	}

	.typing-line {
		font-size: 0.98rem;
	}

	.blog-section {
		padding: 1.25rem 0 0;
	}

	.home-sidebar {
		gap: 0.75rem;
	}

	.section-heading {
		font-size: 1.36rem;
	}

	.post-meta-row {
		flex-wrap: wrap;
	}

	.post-readmore {
		margin-left: auto;
	}
}
</style>
