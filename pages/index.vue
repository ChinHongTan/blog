<script setup lang="ts">
import type { BlogCollectionItem } from "@nuxt/content";
import type { AuthorCollectionItem, DisplayPost } from "~/types/content";
import { useTheme } from "#imports";
import { getAuthorId } from "~/composables/useAuthorId";

const { theme } = useTheme();

const _heroImageSrc = computed(() =>
	theme.value === "dark"
		? "/images/background_dark.jpg"
		: "/images/background_light.jpg",
);

const route = useRoute();
const fullDescription = "這裡有生活，也有故事，隨便看看吧。";

useHead({
	title: "星谷雜貨店",
	meta: [{ name: "description", content: fullDescription }],
});

useSeoMeta({
	ogTitle: "星谷雜貨店",
	ogDescription: fullDescription,
	ogType: "website",
	ogUrl: "https://blog.chinono.dev",
	ogImage: "/images/background_light.jpg",
	twitterCard: "summary_large_image",
	twitterTitle: "星谷雜貨店",
	twitterDescription: fullDescription,
});

const { data: posts, refresh: refreshPosts } = await useAsyncData<
	BlogCollectionItem[]
>("posts", () => queryCollection("blog").order("date", "DESC").all());

const { data: authors, refresh: refreshAuthors } = await useAsyncData(
	"authors",
	() => queryCollection("authors").all(),
);

// Refetch on client when initial payload had no posts (fixes empty home on first load e.g. static/SSR timing)
onMounted(() => {
	if ((posts.value ?? []).length === 0) {
		refreshPosts();
		refreshAuthors();
	}

	// Preload author avatars to prevent lag/layout shift during sidebar transitions
	const records = (authors.value ?? []) as unknown as AuthorCollectionItem[];
	records.forEach((author) => {
		if (author.avatar) {
			const img = new Image();
			img.src = author.avatar;
		}
	});
});

// Author directory: one entry per author file, keyed only by immutable ID (filename stem).
// All frontmatter (name, avatar, bio) from that file belongs to that ID.
const authorDirectory = computed<Record<string, AuthorCollectionItem>>(() => {
	const directory: Record<string, AuthorCollectionItem> = {};
	const records = (authors.value ?? []) as unknown as AuthorCollectionItem[];
	records.forEach((entry) => {
		const id = getAuthorId(entry);
		if (id) directory[id] = entry;
	});
	return directory;
});

function fallbackAvatar(label: string, size = 64) {
	const safeLabel = label?.trim();
	const initial = (safeLabel ? safeLabel[0] : "A")?.toUpperCase() ?? "A";
	return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${initial}`;
}

function enrichPost(post: BlogCollectionItem, path: string): DisplayPost {
	const profile = post.author
		? authorDirectory.value[post.author]
		: undefined;
	return {
		...post,
		path,
		authorAvatar:
			profile?.avatar ??
			(post.author ? fallbackAvatar(post.author, 56) : undefined),
		authorBio: profile?.bio,
		authorDisplayName: profile?.name ?? post.author,
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
const router = useRouter();

const tagFilter = computed(() => route.query.tag as string | undefined);
const yearFilter = computed(() => route.query.year as string | undefined);
const authorFilter = computed(() => route.query.author as string | undefined);
const seriesFilter = computed(() => route.query.series as string | undefined);

const postFilterMeta = computed(() => {
	const meta = new Map<
		string,
		{
			titleLower: string;
			descriptionLower: string;
			year: string;
		}
	>();

	preparedPosts.value.forEach((post) => {
		meta.set(post.id, {
			titleLower: (post.title ?? "").toLowerCase(),
			descriptionLower: (post.description ?? "").toLowerCase(),
			year: new Date(post.date).getFullYear().toString(),
		});
	});

	return meta;
});

const filteredPosts = computed<DisplayPost[]>(() => {
	let filtered = preparedPosts.value || [];

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter((post) => {
			const meta = postFilterMeta.value.get(post.id);
			return (
				!!meta &&
				(meta.titleLower.includes(query) ||
					meta.descriptionLower.includes(query))
			);
		});
	}

	if (tagFilter.value) {
		filtered = filtered.filter(
			(post) =>
				Array.isArray(post.tags) &&
				post.tags.includes(tagFilter.value as string),
		);
	}

	if (yearFilter.value) {
		filtered = filtered.filter(
			(post) =>
				postFilterMeta.value.get(post.id)?.year === yearFilter.value,
		);
	}

	if (authorFilter.value) {
		filtered = filtered.filter(
			(post) => post.author === authorFilter.value,
		);
	}

	if (seriesFilter.value) {
		filtered = filtered.filter(
			(post) =>
				Array.isArray(post.series) &&
				post.series.includes(seriesFilter.value as string),
		);
	}

	if (authorFilter.value) {
		return filtered.sort((a, b) => {
			if (a.pinned && !b.pinned) return -1;
			if (!a.pinned && b.pinned) return 1;
			return 0;
		});
	}

	return filtered;
});

const POSTS_PER_PAGE = 12;
const currentPage = ref(1);

watch([tagFilter, yearFilter, authorFilter, seriesFilter, searchQuery], () => {
	currentPage.value = 1;
});

const paginatedPosts = computed(() => {
	const start = 0;
	const end = currentPage.value * POSTS_PER_PAGE;
	return filteredPosts.value.slice(start, end);
});

const hasMorePosts = computed(
	() => currentPage.value * POSTS_PER_PAGE < filteredPosts.value.length,
);

type TransitionPhase = "idle" | "exiting" | "entering";
type FilterPatch = {
	tag?: string;
	year?: string;
	author?: string;
	series?: string;
};

const EXIT_DURATION_MS = 220;
const ENTER_DURATION_MS = 340;
const STAGGER_MS = 56;

const transitionPhase = ref<TransitionPhase>("idle");
const renderedPosts = ref<DisplayPost[]>([]);
const pressedAuthorId = ref<string | null>(null);
const pendingAuthorSelection = ref<string | undefined>(undefined);
const prefersReducedMotion = ref(false);

let transitionToken = 0;
let isProgrammaticRouteChange = false;
let hasHydrated = false;
let reduceMotionMedia: MediaQueryList | null = null;
let reduceMotionListener: ((event: MediaQueryListEvent) => void) | null = null;
let transitionTimers: ReturnType<typeof setTimeout>[] = [];

function clearTransitionTimers() {
	transitionTimers.forEach((timer) => clearTimeout(timer));
	transitionTimers = [];
}

function waitForTransition(ms: number, token: number) {
	return new Promise<boolean>((resolve) => {
		const timer = setTimeout(() => {
			resolve(token === transitionToken);
		}, ms);
		transitionTimers.push(timer);
	});
}

function normalizeQueryValue(value: unknown) {
	if (Array.isArray(value)) return value[0];
	if (typeof value === "string") return value;
	return undefined;
}

function getFilterSnapshot(querySource: Record<string, unknown>) {
	return {
		tag: normalizeQueryValue(querySource.tag),
		year: normalizeQueryValue(querySource.year),
		author: normalizeQueryValue(querySource.author),
		series: normalizeQueryValue(querySource.series),
	};
}

function sameFilterSnapshot(
	a: ReturnType<typeof getFilterSnapshot>,
	b: ReturnType<typeof getFilterSnapshot>,
) {
	return (
		a.tag === b.tag &&
		a.year === b.year &&
		a.author === b.author &&
		a.series === b.series
	);
}

function buildNextQuery(patch: FilterPatch) {
	const nextQuery: Record<string, string> = {};

	Object.entries(route.query).forEach(([key, value]) => {
		const normalized = normalizeQueryValue(value);
		if (normalized) nextQuery[key] = normalized;
	});

	Object.entries(patch).forEach(([key, value]) => {
		if (!value) {
			nextQuery[key] = "";
			return;
		}
		nextQuery[key] = value;
	});

	return Object.fromEntries(
		Object.entries(nextQuery).filter(([, value]) => value),
	);
}

async function runPostsOnlyTransition(nextAuthorSelection?: string) {
	const token = ++transitionToken;
	clearTransitionTimers();
	pendingAuthorSelection.value = nextAuthorSelection;

	if (prefersReducedMotion.value) {
		renderedPosts.value = [...paginatedPosts.value];
		transitionPhase.value = "idle";
		pendingAuthorSelection.value = undefined;
		return;
	}

	transitionPhase.value = "exiting";
	if (!(await waitForTransition(EXIT_DURATION_MS, token))) return;

	renderedPosts.value = [...paginatedPosts.value];
	transitionPhase.value = "entering";
	if (!(await waitForTransition(ENTER_DURATION_MS, token))) return;

	transitionPhase.value = "idle";
	pendingAuthorSelection.value = undefined;
}

async function runRouteFilterTransition(patch: FilterPatch) {
	const nextQuery = buildNextQuery(patch);
	const currentFilters = getFilterSnapshot(
		route.query as Record<string, unknown>,
	);
	const nextFilters = getFilterSnapshot(nextQuery);
	const scrollTop = typeof window !== "undefined" ? window.scrollY : 0;

	if (sameFilterSnapshot(currentFilters, nextFilters)) {
		return;
	}

	const token = ++transitionToken;
	clearTransitionTimers();
	pendingAuthorSelection.value = nextFilters.author;

	if (prefersReducedMotion.value) {
		isProgrammaticRouteChange = true;
		await router.replace({ path: route.path, query: nextQuery });
		isProgrammaticRouteChange = false;
		await nextTick();
		if (typeof window !== "undefined") {
			window.scrollTo({ top: scrollTop, behavior: "auto" });
		}
		renderedPosts.value = [...paginatedPosts.value];
		transitionPhase.value = "idle";
		pendingAuthorSelection.value = undefined;
		return;
	}

	transitionPhase.value = "exiting";
	if (!(await waitForTransition(EXIT_DURATION_MS, token))) return;

	isProgrammaticRouteChange = true;
	await router.replace({ path: route.path, query: nextQuery });
	isProgrammaticRouteChange = false;
	await nextTick();
	if (typeof window !== "undefined") {
		window.scrollTo({ top: scrollTop, behavior: "auto" });
	}

	if (token !== transitionToken) return;
	renderedPosts.value = [...paginatedPosts.value];
	transitionPhase.value = "entering";
	if (!(await waitForTransition(ENTER_DURATION_MS, token))) return;

	transitionPhase.value = "idle";
	pendingAuthorSelection.value = undefined;
}

const visualAuthorFilter = computed(
	() => pendingAuthorSelection.value ?? authorFilter.value,
);

function isAuthorSelected(authorId: string) {
	return visualAuthorFilter.value === authorId;
}

function isAuthorDimmed(authorId: string) {
	return !!visualAuthorFilter.value && visualAuthorFilter.value !== authorId;
}

function handleAuthorPointerDown(authorId: string) {
	pressedAuthorId.value = authorId;
}

function clearAuthorPress() {
	pressedAuthorId.value = null;
}

function handleAuthorAvatarClick(authorId: string) {
	clearAuthorPress();
	const nextAuthor = authorFilter.value === authorId ? undefined : authorId;
	void runRouteFilterTransition({ author: nextAuthor });
}

function handleTagFilterClick(tag: string) {
	void runRouteFilterTransition({ tag });
}

function handlePostAuthorFilterClick(authorId: string) {
	void runRouteFilterTransition({ author: authorId });
}

function clearAllFilters() {
	void runRouteFilterTransition({
		tag: undefined,
		year: undefined,
		author: undefined,
		series: undefined,
	});
}

function postCardStyle(index: number) {
	if (transitionPhase.value !== "entering" || prefersReducedMotion.value) {
		return undefined;
	}
	return {
		"--card-delay": `${Math.min(index, 6) * STAGGER_MS}ms`,
	};
}

const postsGridClass = computed(() => ({
	"is-exiting": transitionPhase.value === "exiting",
	"is-entering": transitionPhase.value === "entering",
}));

function loadMore() {
	currentPage.value++;
}

const activeFilter = computed(() => {
	if (tagFilter.value) return `標籤：${tagFilter.value}`;
	if (yearFilter.value) return `年份：${yearFilter.value}`;
	if (authorFilter.value) {
		const displayName =
			authorDirectory.value[authorFilter.value]?.name ??
			authorFilter.value;
		return `作者：${displayName}`;
	}
	if (seriesFilter.value) return `系列：${seriesFilter.value}`;
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

const totalSeries = computed(() => {
	const series = new Set<string>();
	preparedPosts.value.forEach((post) => {
		if (Array.isArray(post.series)) {
			post.series.forEach((s) => series.add(s));
		}
	});
	return series.size;
});

const selectedAuthorSummary = computed(() => {
	const selectedAuthorId = visualAuthorFilter.value;
	if (!selectedAuthorId) return null;

	const authorProfile = authorDirectory.value[selectedAuthorId];
	const authorPosts = preparedPosts.value.filter(
		(post) => post.author === selectedAuthorId,
	);
	const authorTags = new Set<string>();
	const authorSeries = new Set<string>();

	authorPosts.forEach((post) => {
		if (Array.isArray(post.tags)) {
			post.tags.forEach((tag) => authorTags.add(tag));
		}
		if (Array.isArray(post.series)) {
			post.series.forEach((s) => authorSeries.add(s));
		}
	});

	return {
		avatar: authorProfile?.avatar ?? fallbackAvatar(selectedAuthorId, 84),
		name: authorProfile?.name ?? selectedAuthorId,
		bio: authorProfile?.bio ?? "",
		social: authorProfile?.social ?? null,
		posts: authorPosts.length,
		tags: authorTags.size,
		series: authorSeries.size,
	};
});

const sidebarProfileCard = computed(() => {
	if (selectedAuthorSummary.value) {
		return {
			avatar: selectedAuthorSummary.value.avatar,
			name: selectedAuthorSummary.value.name,
			motto: selectedAuthorSummary.value.bio || "這位作者暫無個人簡介。",
			social: selectedAuthorSummary.value.social,
			posts: selectedAuthorSummary.value.posts,
			tags: selectedAuthorSummary.value.tags,
			series: selectedAuthorSummary.value.series,
		};
	}

	return {
		avatar: "/images/uploads/103467998_p0 copy.png",
		name: "星谷雜貨店",
		motto: "分享生活點滴的小小天地。",
		social: null,
		posts: totalPosts.value,
		tags: totalTags.value,
		series: totalSeries.value,
	};
});

const sidebarIdentityKey = computed(() => {
	return visualAuthorFilter.value
		? `author-${visualAuthorFilter.value}`
		: "store";
});

const sidebarAuthors = computed(() => {
	const authorCounts = new Map<string, number>();

	preparedPosts.value.forEach((post) => {
		if (post.author) {
			authorCounts.set(
				post.author,
				(authorCounts.get(post.author) || 0) + 1,
			);
		}
	});

	return Array.from(authorCounts.entries())
		.map(([id, count]) => ({
			id,
			name: authorDirectory.value[id]?.name ?? id,
			count,
			avatar: authorDirectory.value[id]?.avatar ?? fallbackAvatar(id, 44),
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

watch(
	paginatedPosts,
	(value) => {
		if (transitionPhase.value === "idle") {
			renderedPosts.value = [...value];
		}
	},
	{ immediate: true },
);

watch(searchQuery, (nextValue, previousValue) => {
	if (!hasHydrated || nextValue === previousValue) return;
	void runPostsOnlyTransition(authorFilter.value);
});

watch(
	[tagFilter, yearFilter, authorFilter, seriesFilter],
	(
		[nextTag, nextYear, nextAuthor, nextSeries],
		[prevTag, prevYear, prevAuthor, prevSeries],
	) => {
		if (!hasHydrated || isProgrammaticRouteChange) return;
		if (
			nextTag === prevTag &&
			nextYear === prevYear &&
			nextAuthor === prevAuthor &&
			nextSeries === prevSeries
		) {
			return;
		}
		void runPostsOnlyTransition(nextAuthor);
	},
);

onMounted(() => {
	const typeSpeed = 100;

	const typeLoop = () => {
		const currentText = typedDescription.value;
		const fullText = fullDescription;

		if (currentText.length < fullText.length) {
			typedDescription.value = fullText.slice(0, currentText.length + 1);
			typingTimer = setTimeout(typeLoop, typeSpeed + Math.random() * 50);
		} else {
			// Done typing — leave text as is, no delete phase
			isTypingDone.value = true;
		}
	};

	// Start typing loop
	typingTimer = setTimeout(typeLoop, 500);

	updateScrollProgress();
	window.addEventListener("scroll", updateScrollProgress, { passive: true });
	window.addEventListener("resize", updateScrollProgress);

	if (typeof window !== "undefined") {
		reduceMotionMedia = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		);
		prefersReducedMotion.value = reduceMotionMedia.matches;
		reduceMotionListener = (event: MediaQueryListEvent) => {
			prefersReducedMotion.value = event.matches;
		};
		reduceMotionMedia.addEventListener("change", reduceMotionListener);
	}

	hasHydrated = true;
});

onBeforeUnmount(() => {
	transitionToken++;
	clearTransitionTimers();

	if (typingTimer) {
		clearTimeout(typingTimer);
		typingTimer = null;
	}

	if (reduceMotionMedia && reduceMotionListener) {
		reduceMotionMedia.removeEventListener("change", reduceMotionListener);
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
				<h1 class="welcome-title">星谷雜貨店</h1>
				<p class="typing-line" :class="{ finished: isTypingDone }">
					{{ typedDescription }}
				</p>
			</div>

			<button
				type="button"
				class="scroll-indicator"
				@click="scrollToPosts"
			>
				<Icon name="heroicons:chevron-down" size="24" />
				<span>向下捲動閱讀文章</span>
			</button>
		</section>

		<section id="posts-list" class="blog-section">
			<div class="blog-layout">
				<aside class="home-sidebar">
					<div class="sidebar-box">
						<Transition name="sidebar-identity" mode="out-in">
							<div
								:key="sidebarIdentityKey"
								class="sidebar-identity"
							>
								<div class="sidebar-profile">
									<img
										:src="sidebarProfileCard.avatar"
										:alt="sidebarProfileCard.name"
										class="site-avatar"
									>
									<h2 class="site-name">
										{{ sidebarProfileCard.name }}
									</h2>
									<p class="site-motto">
										{{ sidebarProfileCard.motto }}
									</p>
									<div
										v-if="sidebarProfileCard.social"
										class="author-social-links"
									>
										<a
											v-if="
												sidebarProfileCard.social.github
											"
											:href="
												sidebarProfileCard.social.github
											"
											target="_blank"
											rel="noopener noreferrer"
											class="social-link"
											title="GitHub"
											><Icon name="mdi:github"
										/></a>
										<a
											v-if="
												sidebarProfileCard.social
													.twitter
											"
											:href="
												sidebarProfileCard.social
													.twitter
											"
											target="_blank"
											rel="noopener noreferrer"
											class="social-link"
											title="Twitter"
											><Icon name="mdi:twitter"
										/></a>
										<a
											v-if="
												sidebarProfileCard.social
													.website
											"
											:href="
												sidebarProfileCard.social
													.website
											"
											target="_blank"
											rel="noopener noreferrer"
											class="social-link"
											title="Website"
											><Icon name="mdi:web"
										/></a>
									</div>
								</div>
								<div class="sidebar-stats">
									<div class="stat-box">
										<span class="stat-value">{{
											sidebarProfileCard.posts
										}}</span>
										<span class="stat-label">文章</span>
									</div>
									<div class="stat-box">
										<span class="stat-value">{{
											sidebarProfileCard.tags
										}}</span>
										<span class="stat-label">標籤</span>
									</div>
									<div class="stat-box">
										<span class="stat-value">{{
											sidebarProfileCard.series
										}}</span>
										<span class="stat-label">系列</span>
									</div>
								</div>
							</div>
						</Transition>
					</div>

					<div
						v-if="sidebarAuthors.length"
						class="sidebar-box author-panel"
					>
						<h3 class="sidebar-box-title">作者</h3>

						<div class="authors-grid" aria-label="作者列表">
							<button
								v-for="author in sidebarAuthors"
								:key="`${author.id}-grid`"
								type="button"
								:class="[
									'author-grid-item',
									{
										'is-selected': isAuthorSelected(
											author.id,
										),
										'is-dimmed': isAuthorDimmed(author.id),
										'is-pressed':
											pressedAuthorId === author.id,
									},
								]"
								:data-author-name="author.name"
								@click="handleAuthorAvatarClick(author.id)"
								@pointerdown="
									handleAuthorPointerDown(author.id)
								"
								@pointerup="clearAuthorPress"
								@pointercancel="clearAuthorPress"
								@pointerleave="clearAuthorPress"
							>
								<img
									:src="author.avatar"
									:alt="author.name"
									class="author-avatar"
								>
							</button>
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
							<button
								type="button"
								class="clear-filter"
								@click="clearAllFilters"
							>
								<Icon name="heroicons:x-mark" size="16" />
							</button>
						</div>
					</div>

					<div
						v-if="renderedPosts.length > 0"
						:class="['posts-grid', postsGridClass]"
					>
						<article
							v-for="(post, index) in renderedPosts"
							:key="post.id"
							class="post-card"
							:style="postCardStyle(index)"
						>
							<NuxtLink :to="post.path" class="post-main-link">
								<div
									v-if="post.featured_image"
									class="post-image"
								>
									<img
										:src="post.featured_image"
										:alt="post.title"
									>
								</div>
							</NuxtLink>
							<div class="post-content">
								<NuxtLink
									:to="post.path"
									class="post-main-link title-link"
								>
									<h3 class="post-title">{{ post.title }}</h3>
								</NuxtLink>
								<p
									v-if="post.description"
									class="post-description"
								>
									{{ post.description }}
								</p>
								<div class="post-meta-row">
									<div class="post-meta-main">
										<template v-if="post.author">
											<img
												:src="
													post.authorAvatar ||
													fallbackAvatar(
														post.author,
														32,
													)
												"
												:alt="
													post.authorDisplayName ||
													post.author
												"
												class="post-author-avatar"
											>
										</template>
										<div class="post-meta-text">
											<button
												v-if="post.author"
												type="button"
												class="post-author-link"
												@click="
													handlePostAuthorFilterClick(
														post.author,
													)
												"
											>
												<span
													class="post-author-name"
													>{{
														post.authorDisplayName ||
														post.author
													}}</span
												>
											</button>
											<span class="meta-item post-date">
												<Icon
													name="heroicons:calendar-days"
													size="15"
													class="meta-icon"
												/>
												{{
													new Date(
														post.date,
													).toLocaleDateString(
														"zh-TW",
														{
															year: "numeric",
															month: "2-digit",
															day: "2-digit",
														},
													)
												}}
											</span>
											<span
												v-if="post.edited_at"
												class="meta-item post-date post-edited-at"
											>
												<Icon
													name="heroicons:pencil-square"
													size="15"
													class="meta-icon"
												/>
												{{
													new Date(
														post.edited_at,
													).toLocaleDateString(
														"zh-TW",
														{
															year: "numeric",
															month: "2-digit",
															day: "2-digit",
														},
													)
												}}
											</span>
											<div
												v-if="
													Array.isArray(post.tags) &&
													post.tags.length
												"
												class="tags-group"
											>
												<Icon
													name="heroicons:tag"
													size="15"
													class="meta-icon"
												/>
												<button
													v-for="tag in post.tags"
													:key="`${post.id}-${tag}`"
													type="button"
													class="post-tag-link"
													@click="
														handleTagFilterClick(
															tag,
														)
													"
												>
													#{{ tag }}
												</button>
											</div>
										</div>
									</div>
									<NuxtLink
										:to="post.path"
										class="post-readmore"
									>
										<span>閱讀更多</span>
										<Icon
											name="heroicons:chevron-right"
											size="16"
										/>
									</NuxtLink>
								</div>
							</div>
						</article>
					</div>
					<div
						v-if="hasMorePosts && transitionPhase === 'idle'"
						class="load-more-wrap"
					>
						<button
							type="button"
							class="load-more-btn"
							@click="loadMore"
						>
							載入更多文章
						</button>
					</div>

					<div
						v-else-if="filteredPosts.length === 0"
						class="no-results"
					>
						<Icon
							name="heroicons:magnifying-glass-circle"
							size="48"
						/>
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
	transition:
		filter 0.18s linear,
		transform 0.2s ease,
		opacity 0.6s ease;
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
	grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
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
	transition:
		box-shadow 0.3s ease,
		transform 0.3s ease;
}

.sidebar-box:hover {
	box-shadow: var(--shadow-md);
	transform: translateY(-2px);
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

.sidebar-profile + .sidebar-stats {
	margin-top: 0.9rem;
}

.sidebar-identity {
	will-change: opacity, transform, filter;
}

.sidebar-identity-enter-active {
	transition:
		opacity 340ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 340ms cubic-bezier(0.22, 1, 0.36, 1),
		filter 340ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sidebar-identity-leave-active {
	transition:
		opacity 220ms cubic-bezier(0.32, 0.72, 0, 1),
		transform 220ms cubic-bezier(0.32, 0.72, 0, 1),
		filter 220ms cubic-bezier(0.32, 0.72, 0, 1);
}

.sidebar-identity-enter-from {
	opacity: 0;
	transform: translateY(10px) scale(0.985);
	filter: blur(7px);
}

.sidebar-identity-leave-to {
	opacity: 0;
	transform: translateY(-10px) scale(1.015);
	filter: blur(7px);
}

.site-avatar {
	width: 84px;
	height: 84px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid var(--color-primary-light);
	margin-bottom: 0.6rem;
	transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sidebar-profile:hover .site-avatar {
	transform: scale(1.08) rotate(5deg);
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

.author-social-links {
	display: flex;
	justify-content: center;
	gap: 0.8rem;
	margin-top: 0.8rem;
}

.social-link {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	background-color: var(--color-bg-secondary);
	color: var(--color-text-secondary);
	transition: all 0.2s ease;
}

.social-link:hover {
	background-color: var(--color-primary);
	color: white;
	transform: translateY(-2px);
}

.sidebar-stats {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.6rem;
}

.stat-box {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.1rem;
	transition: transform 0.2s ease;
}

.stat-box:hover {
	transform: translateY(-2px);
}

.stat-value {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--color-text-primary);
}

.stat-label {
	font-size: 0.8rem;
	font-weight: 500;
	color: var(--color-text-tertiary);
}

.author-panel {
	display: flex;
	flex-direction: column;
	gap: 0.55rem;
}

.author-avatar {
	width: 30px;
	height: 30px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--color-border-light);
	transition: transform 0.2s ease;
}

.authors-grid {
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	gap: 0.4rem;
}

.author-grid-item {
	display: inline-flex;
	justify-content: center;
	padding: 0.2rem;
	border: none;
	background: transparent;
	font: inherit;
	cursor: pointer;
	border-radius: 8px;
	position: relative;
	transition:
		opacity 0.2s ease,
		background-color 0.2s ease,
		transform 0.16s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.author-grid-item:hover {
	background: color-mix(in srgb, var(--color-primary-light) 16%, transparent);
}

.author-grid-item.is-pressed {
	transform: scale(0.92);
}

.author-grid-item.is-dimmed {
	opacity: 0.65;
}

.author-grid-item.is-selected .author-avatar {
	opacity: 1;
	border-color: color-mix(in srgb, var(--color-primary-light) 75%, #9fd0ff);
	box-shadow:
		0 0 0 2px color-mix(in srgb, var(--color-primary) 34%, transparent),
		0 0 18px color-mix(in srgb, var(--color-primary) 28%, transparent);
}

.author-grid-item:hover .author-avatar {
	transform: scale(1.08);
}

.author-grid-item::before,
.author-grid-item::after {
	position: absolute;
	opacity: 0;
	visibility: hidden;
	transition:
		opacity 0.25s ease,
		transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
		visibility 0.25s;
	z-index: 20;
	pointer-events: none;
}

.author-grid-item::before {
	content: attr(data-author-name);
	bottom: calc(100% + 8px);
	left: 50%;
	transform: translateX(-50%) translateY(5px);
	background: #0b1120;
	color: #f8fafc;
	padding: 0.35rem 0.65rem;
	border-radius: 6px;
	font-size: 0.76rem;
	font-weight: 600;
	white-space: nowrap;
	box-shadow:
		0 6px 16px rgba(0, 0, 0, 0.4),
		0 0 0 1px rgba(255, 255, 255, 0.08) inset;
	letter-spacing: 0.03em;
}

.author-grid-item::after {
	content: "";
	bottom: calc(100% + 2px);
	left: 50%;
	transform: translateX(-50%) translateY(5px);
	border: 6px solid transparent;
	border-top-color: #0b1120;
}

.author-grid-item:hover::before,
.author-grid-item:hover::after {
	opacity: 1;
	visibility: visible;
	transform: translateX(-50%) translateY(0);
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
	border: none;
	font-size: 0.85rem;
	color: var(--color-primary);
	font: inherit;
	cursor: pointer;
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
	border: none;
	background: transparent;
	padding: 0;
	font: inherit;
	cursor: pointer;
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
	padding: 0;
	border: none;
	background: var(--color-primary);
	color: white;
	border-radius: 999px;
	text-decoration: none;
	cursor: pointer;
}

.posts-grid {
	display: grid;
	gap: 1.65rem;
}

.posts-grid.is-exiting .post-card {
	opacity: 0;
	transform: translateY(6px) scale(0.98);
	transition:
		opacity 220ms cubic-bezier(0.32, 0.72, 0, 1),
		transform 220ms cubic-bezier(0.32, 0.72, 0, 1);
}

.posts-grid.is-entering .post-card {
	opacity: 0;
	transform: translateY(15px) scale(0.992);
	animation: post-card-rise 430ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
	animation-delay: var(--card-delay, 0ms);
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
	will-change: transform, opacity;
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
	height: 140px;
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
	padding: 1.15rem;
	display: flex;
	flex-direction: column;
	flex: 1;
	gap: 0.65rem;
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
	cursor: pointer;
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

@keyframes post-card-rise {
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
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

@media (prefers-reduced-motion: reduce) {
	.posts-grid.is-exiting .post-card,
	.posts-grid.is-entering .post-card {
		animation: none;
		transform: none;
		transition: opacity 110ms linear;
	}

	.sidebar-identity-enter-active,
	.sidebar-identity-leave-active {
		transition: opacity 110ms linear;
	}

	.sidebar-identity-enter-from,
	.sidebar-identity-leave-to {
		transform: none;
		filter: none;
	}

	.author-grid-item,
	.author-avatar,
	.site-avatar,
	.sidebar-box {
		transition-duration: 0.01ms !important;
	}
}

.load-more-wrap {
	display: flex;
	justify-content: center;
	margin-top: 2rem;
}
.load-more-btn {
	padding: 0.75rem 2rem;
	font-size: 0.95rem;
	font-weight: 500;
	color: var(--color-text-primary);
	background: var(--color-bg-primary);
	border: 1px solid var(--color-border-light);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
}
.load-more-btn:hover {
	background: var(--color-bg-blue-tint);
	border-color: var(--color-primary);
	color: var(--color-primary-dark);
}
</style>
