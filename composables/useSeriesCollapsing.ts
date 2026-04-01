import type { Ref } from "vue";
import type {
	AuthorCollectionItem,
	DisplayPost,
	FeedItem,
	SeriesCardItem,
} from "~/types/content";
import { getPostStem } from "~/utils/content-routing";
import { buildFallbackAvatar } from "~/utils/avatar";

type SeriesData = { series: Record<string, string[]> } | null;

export function useSeriesCollapsing(
	filteredPosts: Ref<DisplayPost[]>,
	seriesData: Ref<SeriesData>,
	seriesFilter: Ref<string | undefined>,
	authorDirectory: Ref<Record<string, AuthorCollectionItem>>,
) {
	const feedItems = computed<FeedItem[]>(() => {
		const posts = filteredPosts.value;
		if (!posts.length) return [];

		// Bypass collapsing when user explicitly filters by series
		if (seriesFilter.value) {
			return posts.map((p) => ({ ...p, kind: "post" as const }));
		}

		const seriesMap = seriesData.value?.series ?? {};

		// Build reverse map: post stem → series name
		const stemToSeries = new Map<string, string>();
		for (const [name, stems] of Object.entries(seriesMap)) {
			for (const stem of stems) {
				stemToSeries.set(stem, name);
			}
		}

		// Partition into series buckets and standalone posts
		const seriesBuckets = new Map<string, DisplayPost[]>();
		const standalone: DisplayPost[] = [];

		for (const post of posts) {
			const stem = getPostStem(post);
			const seriesName = stem ? stemToSeries.get(stem) : undefined;
			if (seriesName) {
				let bucket = seriesBuckets.get(seriesName);
				if (!bucket) {
					bucket = [];
					seriesBuckets.set(seriesName, bucket);
				}
				bucket.push(post);
			} else {
				standalone.push(post);
			}
		}

		// Build SeriesCardItems
		const seriesCards: SeriesCardItem[] = [];
		for (const [seriesName, bucketPosts] of seriesBuckets) {
			const stemOrder = seriesMap[seriesName] || [];
			const sorted = [...bucketPosts].sort((a, b) => {
				const stemA = getPostStem(a) || "";
				const stemB = getPostStem(b) || "";
				const indexA = stemOrder.indexOf(stemA);
				const indexB = stemOrder.indexOf(stemB);
				const idxA = indexA === -1 ? Infinity : indexA;
				const idxB = indexB === -1 ? Infinity : indexB;
				return idxA - idxB;
			});
			const latestPost = sorted[sorted.length - 1] ?? bucketPosts[0];
			const authorIds = [
				...new Set(
					bucketPosts
						.map((p) => p.author)
						.filter((a): a is string => !!a),
				),
			];

			seriesCards.push({
				kind: "series-card",
				seriesName,
				postCount: bucketPosts.length,
				totalPostCount: seriesMap[seriesName]?.length ?? bucketPosts.length,
				latestDate: new Date(latestPost.date),
				latestPost,
				authors: authorIds.map((id) => ({
					id,
					name: authorDirectory.value[id]?.name ?? id,
					avatar:
						authorDirectory.value[id]?.avatar ??
						buildFallbackAvatar(id, 32),
				})),
				posts: sorted,
			});
		}

		// Merge and sort by date descending
		const items: FeedItem[] = [
			...standalone.map((p) => ({ ...p, kind: "post" as const })),
			...seriesCards,
		];

		items.sort((a, b) => {
			const dateA =
				a.kind === "series-card" ? a.latestDate : new Date(a.date);
			const dateB =
				b.kind === "series-card" ? b.latestDate : new Date(b.date);
			return dateB.getTime() - dateA.getTime();
		});

		return items;
	});

	return { feedItems };
}
