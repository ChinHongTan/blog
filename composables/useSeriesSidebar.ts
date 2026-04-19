import { computed, onMounted, ref, unref, type MaybeRef } from "vue";
import { getPostStem, normalizePath, safeDecode } from "~/utils/content-routing";
import { resolvePostPath } from "~/utils/post-path";

type SeriesPost = {
	id?: string;
	path?: string;
	stem?: string;
	title?: string;
	date?: string;
};

type SeriesConfig = {
	series?: Record<string, string[]>;
};

type UseSeriesSidebarOptions = {
	page: MaybeRef<SeriesPost | null | undefined>;
	seriesData: MaybeRef<SeriesConfig | null | undefined>;
	routePath: MaybeRef<string>;
	routeSeriesQuery: MaybeRef<string | undefined>;
};

const WINDOW_SIZE = 5;

export async function useSeriesSidebar(options: UseSeriesSidebarOptions) {
	const activeSeriesName = computed(() => {
		let querySeries = unref(options.routeSeriesQuery);
		if (querySeries) {
			querySeries = querySeries.replace(/\+/g, " ");
			return querySeries;
		}

		const stem = getPostStem(unref(options.page));
		const configuredSeries = unref(options.seriesData)?.series;
		if (stem && configuredSeries) {
			for (const [seriesName, stems] of Object.entries(configuredSeries)) {
				if (stems.includes(stem)) return seriesName;
			}
		}
		return null;
	});

	const hasSeries = computed(() => !!activeSeriesName.value);

	const showSeriesSidebar = ref(true);

	onMounted(() => {
		if (typeof window !== "undefined" && window.innerWidth < 1400) {
			showSeriesSidebar.value = false;
		}
	});

	// Snapshot reactive values at call time. The fetcher closure previously
	// read activeSeriesName.value directly, which meant a re-invocation
	// during navigation (when page.value is transiently null, so the
	// computed falls through to null) wrote [] into the shared cache under
	// the correct series key and poisoned the sidebar for the rest of the
	// session.
	const seriesKeySnapshot = activeSeriesName.value;
	const stemsForSeriesSnapshot = seriesKeySnapshot
		? unref(options.seriesData)?.series?.[seriesKeySnapshot] || []
		: [];

	const { data: seriesAllPosts } = await useAsyncData(
		`series-sidebar-${seriesKeySnapshot || "none"}`,
		async () => {
			if (!seriesKeySnapshot || stemsForSeriesSnapshot.length === 0) {
				return [] as SeriesPost[];
			}
			const allPosts = await queryCollection("blog")
				.order("date", "DESC")
				.all();

			const postsInSeries = allPosts.filter((post) => {
				const stem = getPostStem(post);
				return stemsForSeriesSnapshot.includes(stem);
			});

			return postsInSeries.sort((a, b) => {
				const stemA = getPostStem(a);
				const stemB = getPostStem(b);
				let orderA = stemsForSeriesSnapshot.indexOf(stemA);
				let orderB = stemsForSeriesSnapshot.indexOf(stemB);

				if (orderA === -1) orderA = Infinity;
				if (orderB === -1) orderB = Infinity;

				if (orderA !== orderB) return orderA - orderB;

				const dA = new Date(a.date || 0).getTime();
				const dB = new Date(b.date || 0).getTime();
				return dA - dB;
			});
		},
	);

	function getSeriesPostPath(post: SeriesPost): string {
		return resolvePostPath(post, "/blog");
	}

	const currentSeriesIndex = computed(() => {
		if (!seriesAllPosts.value) return -1;
		const currentPath = normalizePath(safeDecode(unref(options.routePath)));
		return seriesAllPosts.value.findIndex((post) => {
			const postPath = getSeriesPostPath(post);
			return normalizePath(postPath) === currentPath;
		});
	});

	const seriesWindow = computed(() => {
		const posts = seriesAllPosts.value ?? [];
		if (posts.length <= WINDOW_SIZE * 2 + 1) {
			return { posts, startIndex: 0 };
		}
		const idx = currentSeriesIndex.value;
		if (idx < 0) {
			return { posts: posts.slice(0, WINDOW_SIZE * 2 + 1), startIndex: 0 };
		}

		let start = Math.max(0, idx - WINDOW_SIZE);
		let end = Math.min(posts.length, idx + WINDOW_SIZE + 1);

		if (start === 0) end = Math.min(posts.length, WINDOW_SIZE * 2 + 1);
		if (end === posts.length) {
			start = Math.max(0, posts.length - (WINDOW_SIZE * 2 + 1));
		}

		return { posts: posts.slice(start, end), startIndex: start };
	});

	const seriesPrevPost = computed(() => {
		const posts = seriesAllPosts.value ?? [];
		const idx = currentSeriesIndex.value;
		if (idx <= 0) return null;
		return posts[idx - 1] ?? null;
	});

	const seriesNextPost = computed(() => {
		const posts = seriesAllPosts.value ?? [];
		const idx = currentSeriesIndex.value;
		if (idx < 0 || idx >= posts.length - 1) return null;
		return posts[idx + 1] ?? null;
	});

	return {
		activeSeriesName,
		hasSeries,
		seriesAllPosts,
		seriesWindow,
		seriesPrevPost,
		seriesNextPost,
		currentSeriesIndex,
		showSeriesSidebar,
		getSeriesPostPath,
	};
}
