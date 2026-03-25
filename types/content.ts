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
};
