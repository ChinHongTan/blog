<script setup lang="ts">
import type { BlogCollectionItem } from "@nuxt/content";
import type { AuthorCollectionItem, DisplayPost } from "~/types/content";
import { useTheme } from "#imports";
import { getAuthorId } from "~/composables/useAuthorId";
import { getPostStem } from "~/utils/content-routing";
import { buildFallbackAvatar } from "~/utils/avatar";
import { resolvePostPath } from "~/utils/post-path";

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

const { data: seriesData } = await useAsyncData("series-global-data", () =>
	queryCollection("series").first(),
);

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

const seriesStemToNames = computed(() => {
	const mapping = new Map<string, Set<string>>();
	const seriesMap = seriesData.value?.series ?? {};

	Object.entries(seriesMap).forEach(([seriesName, stems]) => {
		stems.forEach((stem) => {
			const existing = mapping.get(stem);
			if (existing) {
				existing.add(seriesName);
				return;
			}
			mapping.set(stem, new Set([seriesName]));
		});
	});

	return mapping;
});

function getSeriesNamesForPost(post: {
	stem?: string;
	id?: string;
	path?: string;
}) {
	const stem = getPostStem(post);
	if (!stem) return [];
	const mappedNames = seriesStemToNames.value.get(stem);
	return mappedNames ? Array.from(mappedNames) : [];
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
			(post.author ? buildFallbackAvatar(post.author, 56) : undefined),
		authorBio: profile?.bio,
		authorDisplayName: profile?.name ?? post.author,
	};
}

const preparedPosts = computed<DisplayPost[]>(() => {
	const rawPosts = posts.value ?? [];
	return rawPosts.map((post) => {
		return enrichPost(post, resolvePostPath(post, "/blog"));
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
				getSeriesNamesForPost(post).includes(
					seriesFilter.value as string,
				),
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

type TransitionPhase = "idle" | "exiting" | "entering";
type FilterPatch = {
	tag?: string;
	year?: string;
	author?: string;
	series?: string;
};

const EXIT_DURATION_MS = 220;
const ENTER_DURATION_MS = 1150;
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
		renderedPosts.value = [...filteredPosts.value];
		transitionPhase.value = "idle";
		pendingAuthorSelection.value = undefined;
		return;
	}

	transitionPhase.value = "exiting";
	if (!(await waitForTransition(EXIT_DURATION_MS, token))) return;

	renderedPosts.value = [...filteredPosts.value];
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
		renderedPosts.value = [...filteredPosts.value];
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
	renderedPosts.value = [...filteredPosts.value];
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

function handleSeriesFilterClick(series: string) {
	void runRouteFilterTransition({ series });
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
		"--card-delay": `${Math.min(index, 14) * STAGGER_MS}ms`,
	};
}

const postsGridClass = computed(() => ({
	"is-exiting": transitionPhase.value === "exiting",
	"is-entering": transitionPhase.value === "entering",
}));

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
	const series = new Set<string>(Object.keys(seriesData.value?.series ?? {}));
	preparedPosts.value.forEach((post) => {
		getSeriesNamesForPost(post).forEach((s) => series.add(s));
	});
	return series.size;
});

interface TimelineDate {
	dateLabel: string;
	posts: { post: DisplayPost; globalIndex: number }[];
}

interface TimelineYear {
	year: string;
	count: number;
	dates: TimelineDate[];
}

const groupedTimeline = computed<TimelineYear[]>(() => {
		const yearsObj: Record<string, Record<string, { post: DisplayPost; globalIndex: number }[]>> = {};
		let globalIndex = 0;

	renderedPosts.value.forEach((post) => {
		const dateObj = new Date(post.date);
		const yearStr = dateObj.getFullYear().toString();
		const monthObj = dateObj.getMonth() + 1;
		const dayObj = dateObj.getDate();
		const dateLabel = `${monthObj.toString().padStart(2, "0")}-${dayObj.toString().padStart(2, "0")}`;

		if (!yearsObj[yearStr]) {
			yearsObj[yearStr] = {};
		}
		if (!yearsObj[yearStr][dateLabel]) {
			yearsObj[yearStr][dateLabel] = [];
		}
		yearsObj[yearStr][dateLabel].push({ post: post as unknown as DisplayPost, globalIndex: globalIndex++ });
	});

	return Object.entries(yearsObj)
		.sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
		.map(([year, datesObj]) => {
			const sortedDates = Object.entries(datesObj)
				.sort((a, b) => b[0].localeCompare(a[0]))
				.map(([dateLabel, posts]) => ({
					dateLabel,
					posts,
				}));

			const count = sortedDates.reduce(
				(acc, curr) => acc + curr.posts.length,
				0,
			);

			return { year, count, dates: sortedDates };
		});
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
		getSeriesNamesForPost(post).forEach((s) => authorSeries.add(s));
	});

	return {
		avatar:
			authorProfile?.avatar ??
			buildFallbackAvatar(selectedAuthorId, 84),
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
			avatar:
				authorDirectory.value[id]?.avatar ??
				buildFallbackAvatar(id, 44),
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
	filteredPosts,
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
			<NuxtImg
				src="/images/background_light.jpg"
				alt=""
				class="hero-image light-mode"
				:class="{ active: theme === 'light' }"
				sizes="100vw"
				format="webp"
				preload
				fetchpriority="high"
			/>
			<NuxtImg
				src="/images/background_dark.jpg"
				alt=""
				class="hero-image dark-mode"
				:class="{ active: theme === 'dark' }"
				sizes="100vw"
				format="webp"
				preload
				fetchpriority="high"
			/>
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
									<NuxtImg
										:src="sidebarProfileCard.avatar"
										:alt="sidebarProfileCard.name"
										class="site-avatar"
										width="84"
										height="84"
										format="webp"
										loading="lazy"
									/>
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
								<NuxtImg
									:src="author.avatar"
									:alt="author.name"
									class="author-avatar"
									width="30"
									height="30"
									format="webp"
									loading="lazy"
								/>
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
						:class="['timeline-list', postsGridClass]"
					>
						<div
							v-for="yearGroup in groupedTimeline"
							:key="yearGroup.year"
							class="timeline-year-group"
						>
							<div class="timeline-year-header">
								<h2 class="timeline-year">{{ yearGroup.year }}</h2>
								<span class="timeline-count">{{ yearGroup.count }}</span>
							</div>

							<div class="timeline-dates-container">
								<div
									v-for="(dateGroup, dateIndex) in yearGroup.dates"
									:key="dateGroup.dateLabel"
									:class="['timeline-date-group', { 'is-last': dateIndex === yearGroup.dates.length - 1 }]"
								>
									<div class="timeline-date-label">
										<div class="timeline-node" />
										<span class="timeline-date-text">{{ dateGroup.dateLabel }}</span>
									</div>

									<div class="timeline-posts">
										<article
											v-for="itemObj in dateGroup.posts"
											:key="itemObj.post.id"
											class="timeline-post-item"
											:style="postCardStyle(itemObj.globalIndex)"
										>
											<div class="timeline-post-node" />
											<div class="timeline-post-main">
												<NuxtLink :to="itemObj.post.path" class="archive-title-link">
													<h3 class="archive-title">{{ itemObj.post.title }}</h3>
												</NuxtLink>
												
												<div class="archive-item-tags">
													<button
														v-if="itemObj.post.author"
														type="button"
														class="archive-author-btn"
														@click="handlePostAuthorFilterClick(itemObj.post.author)"
													>
														<Icon name="heroicons:user-16-solid" size="14" />
														{{ itemObj.post.authorDisplayName || itemObj.post.author }}
													</button>
													<div
														v-if="getSeriesNamesForPost(itemObj.post).length"
														class="archive-series-group"
													>
														<button
															v-for="seriesName in getSeriesNamesForPost(itemObj.post)"
															:key="`${itemObj.post.id}-${seriesName}`"
															type="button"
															class="archive-series-link"
															@click="handleSeriesFilterClick(seriesName)"
														>
															<Icon name="heroicons:bookmark-20-solid" size="14" />
															{{ seriesName }}
														</button>
													</div>
													<div
														v-if="Array.isArray(itemObj.post.tags) && itemObj.post.tags.length"
														class="archive-tags-group"
													>
														<button
															v-for="tag in itemObj.post.tags"
															:key="`${itemObj.post.id}-${tag}`"
															type="button"
															class="archive-tag-link"
															@click="handleTagFilterClick(tag)"
														>
															#{{ tag }}
														</button>
													</div>
												</div>
											</div>
										</article>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div
						v-if="filteredPosts.length === 0"
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
	color: var(--color-white-soft);
	text-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.typing-line {
	margin: 0;
	font-size: clamp(1rem, 2vw, 1.35rem);
	line-height: 1.8;
	min-height: 2.2em;
	color: var(--color-white-muted);
	text-shadow: 0 6px 18px rgba(0, 0, 0, 0.38);
}

.typing-line::after {
	content: "";
	display: inline-block;
	width: 1px;
	height: 1.1em;
	background: var(--color-white-soft);
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
	color: var(--color-white-muted);
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
	scroll-margin-top: calc(var(--header-height, 64px) + 0.5rem);
	min-height: 80vh;
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
	border-radius: var(--radius-xl);
	padding: 1rem;
	box-shadow: var(--shadow-sm);
	backdrop-filter: saturate(1.08) blur(var(--glass-blur));
	transition:
		box-shadow var(--transition-slow),
		transform var(--transition-slow);
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
	border-radius: var(--radius-full);
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
	border-radius: var(--radius-full);
	background-color: var(--color-bg-secondary);
	color: var(--color-text-secondary);
	transition: all var(--transition-base);
}

.social-link:hover {
	background-color: var(--color-primary);
	color: var(--color-white);
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
	transition: transform var(--transition-base);
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

.author-panel .sidebar-box-title {
	text-align: center;
	padding-left: 0;
	border-left: none;
}

.author-avatar {
	width: 30px;
	height: 30px;
	border-radius: var(--radius-full);
	object-fit: cover;
	border: 1px solid var(--color-border-light);
	transition: transform var(--transition-base);
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
	border-radius: var(--radius-md);
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
	border-radius: var(--radius-sm);
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
	color: var(--color-text-secondary);
	text-decoration: none;
	transition: color var(--transition-base);
}

.post-readmore:hover {
	color: var(--color-primary);
}

.post-readmore :deep(svg) {
	transition:
		transform var(--transition-base),
		color var(--transition-base);
}

.post-readmore:hover :deep(svg) {
	transform: translateX(4px);
}

/* Tag Links */
.post-tag-link {
	text-decoration: none;
	background: transparent;
	padding: 0;
	border-radius: 0;
	border: none;
	font-size: 0.85rem;
	color: var(--color-text-tertiary);
	font: inherit;
	cursor: pointer;
	transition: color var(--transition-base);
	display: inline-block;
}

.post-tag-link:hover {
	color: var(--color-primary);
}

/* Author Link */
.post-author-link {
	text-decoration: none;
	border: none;
	background: transparent;
	padding: 0;
	font: inherit;
	cursor: pointer;
	transition: opacity var(--transition-base);
}

.post-author-link:hover .post-author-name {
	color: var(--color-primary);
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
	border-radius: var(--radius-pill);
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
	color: var(--color-white);
	border-radius: var(--radius-pill);
	text-decoration: none;
	cursor: pointer;
}

.timeline-list {
display: flex;
flex-direction: column;
gap: 2.5rem;
}

.timeline-list.is-exiting .timeline-post-item {
opacity: 0;
transform: translateY(6px) scale(0.98);
transition:
opacity 220ms cubic-bezier(0.32, 0.72, 0, 1),
transform 220ms cubic-bezier(0.32, 0.72, 0, 1);
}

.timeline-list.is-entering .timeline-post-item {
opacity: 0;
transform: translateY(15px) scale(0.992);
animation: post-card-rise 430ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
animation-delay: var(--card-delay, 0ms);
}

.timeline-year-group {
display: flex;
flex-direction: column;
gap: 1.25rem;
}

.timeline-year-header {
display: flex;
align-items: center;
gap: 0.75rem;
}

.timeline-year {
font-size: 1.85rem;
font-weight: 700;
color: var(--color-text-primary);
margin: 0;
letter-spacing: 0.02em;
}

.timeline-count {
background: var(--color-bg-secondary);
color: var(--color-text-secondary);
font-size: 0.85rem;
font-weight: 600;
padding: 0.15rem 0.6rem;
border-radius: var(--radius-pill);
border: 1px solid var(--color-border-light);
}

.timeline-dates-container {
display: flex;
flex-direction: column;
padding-left: 0.75rem;
}

.timeline-date-group {
display: flex;
flex-direction: column;
position: relative;
padding-bottom: 2rem;
}

.timeline-date-group:last-child {
padding-bottom: 2.5rem;
}

/* The vertical dashed/solid line */
.timeline-date-group::before {
content: '';
position: absolute;
left: 0.35rem; /* Center aligned with the 0.8rem node */
top: 1.5rem;   /* Start below the node */
bottom: -0.2rem; /* Extend to connect to next node */
width: 2px;
background: var(--color-border-medium);
opacity: 0.4;
}

.timeline-date-label {
display: flex;
align-items: center;
gap: 1rem;
margin-bottom: 1rem;
position: relative;
z-index: 1;
}

.timeline-node {
width: 0.8rem;
height: 0.8rem;
border-radius: 50%;
background: transparent;
border: 2px solid var(--color-text-secondary);
position: relative;
left: -0.05rem; /* Fine tune alignment with line */
}

.timeline-date-text {
font-size: 0.85rem;
font-weight: 600;
color: var(--color-text-secondary);
font-family: monospace;
}

.timeline-posts {
display: flex;
flex-direction: column;
gap: 1.15rem;
padding-left: 2rem; /* Indent posts from the line */
}

.timeline-post-item {
display: flex;
flex-direction: column;
position: relative;
}

.timeline-post-node {
position: absolute;
left: calc(-2rem + 0.35rem + 1px - 0.2rem);
top: 0.65rem; /* align roughly with the middle of the first line of text */
width: 0.4rem;
height: 0.4rem;
border-radius: 50%;
background: var(--color-border-medium);
z-index: 1;
}

.timeline-post-main {
display: flex;
flex-direction: column;
gap: 0.4rem;
}

.archive-title-link {
text-decoration: none;
color: inherit;
display: inline-block;
}

.archive-title {
font-size: 1.15rem;
font-weight: 500;
margin: 0;
color: var(--color-text-primary);
line-height: 1.4;
transition: color var(--transition-base);
}

.archive-title-link:hover .archive-title {
color: var(--color-primary);
}

.archive-author-btn {
background: none;
border: none;
padding: 0;
display: inline-flex;
align-items: center;
gap: 0.25rem;
font-size: 0.85rem;
color: var(--color-text-tertiary);
cursor: pointer;
transition: color var(--transition-base);
}

.archive-author-btn:hover {
color: var(--color-primary);
}

.archive-item-tags {
display: flex;
flex-wrap: wrap;
gap: 0.8rem;
align-items: center;
margin-top: 0.15rem;
}

.archive-series-group,
.archive-tags-group {
display: flex;
flex-wrap: wrap;
gap: 0.5rem;
}

.archive-series-link,
.archive-tag-link {
background: none;
padding: 0;
border: none;
font-size: 0.8rem;
color: var(--color-text-tertiary);
cursor: pointer;
display: inline-flex;
align-items: center;
gap: 0.25rem;
transition: color var(--transition-base);
}

.archive-series-link:hover,
.archive-tag-link:hover {
color: var(--color-primary);
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
</style>

