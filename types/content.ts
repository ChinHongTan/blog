import type { BlogCollectionItem } from "@nuxt/content";

export type AuthorCollectionItem = {
	name?: string;
	bio?: string;
	avatar?: string;
	banner?: string;
	path?: string;
	social?: {
		github?: string;
		twitter?: string;
		website?: string;
	};
	[key: string]: unknown;
};

export type DisplayPost = BlogCollectionItem & {
	path: string;
	authorAvatar?: string;
	authorBio?: string;
	authorDisplayName?: string;
	pinned?: boolean;
};

export type SeriesCardItem = {
	kind: "series-card";
	seriesName: string;
	postCount: number;
	totalPostCount: number;
	latestDate: Date;
	latestPost: DisplayPost;
	authors: Array<{ id: string; name: string; avatar: string }>;
	posts: DisplayPost[];
};

export type FeedItem =
	| (DisplayPost & { kind: "post" })
	| SeriesCardItem;
