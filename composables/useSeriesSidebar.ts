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

	const { data: seriesAllPosts } = await useAsyncData(
		`series-sidebar-${activeSeriesName.value || "none"}`,
		async () => {
			if (!activeSeriesName.value) return [] as SeriesPost[];
			const allPosts = await queryCollection("blog")
				.order("date", "DESC")
				.all();

			const stemsForSeries =
				unref(options.seriesData)?.series?.[activeSeriesName.value] || [];

			const postsInSeries = allPosts.filter((post) => {
				const stem = getPostStem(post);
				return stemsForSeries.includes(stem);
			});

			return postsInSeries.sort((a, b) => {
				const stemA = getPostStem(a);
				const stemB = getPostStem(b);
				let orderA = stemsForSeries.indexOf(stemA);
				let orderB = stemsForSeries.indexOf(stemB);

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

	return {
		activeSeriesName,
		hasSeries,
		seriesAllPosts,
		seriesWindow,
		showSeriesSidebar,
		getSeriesPostPath,
	};
}
