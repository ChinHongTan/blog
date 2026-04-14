import { defineCollection, defineContentConfig } from "@nuxt/content";
import { asSitemapCollection } from "@nuxtjs/sitemap/content";
import { z } from "zod";

export default defineContentConfig({
	collections: {
		blog: defineCollection(
			asSitemapCollection({
				type: "page",
				source: "blog/*.md",
				schema: z.object({
					title: z.string().optional(),
					description: z.string().optional(),
					author: z.string().optional(),

					date: z.coerce.date(),
					draft: z.boolean().optional(),
					pinned: z.boolean().optional(),
					featured_image: z.string().optional(),
					edited_at: z.coerce.date().optional(),
					tags: z.array(z.string()).optional(),
					series: z
						.union([z.string(), z.array(z.string())])
						.transform((v) => (typeof v === "string" ? v : v[0]))
						.optional(),
					seriesOrder: z.number().optional(),
				}),
			}),
		),
		drafts: defineCollection({
			type: "page",
			source: "drafts/*.md",
			schema: z.object({
				title: z.string().optional(),
				description: z.string().optional(),
				author: z.string().optional(),
				date: z.string().optional(),
				path: z.string().optional(),
			}),
		}),
		authors: defineCollection(
			asSitemapCollection({
				type: "page",
				source: "authors/**/*.md",
				schema: z.object({
					name: z.string(),
					bio: z.string().optional(),
					avatar: z.string().optional(),
					banner: z.string().optional(),
					social: z
						.object({
							github: z.string().optional(),
							twitter: z.string().optional(),
							website: z.string().optional(),
						})
						.optional(),
					path: z.string().optional(),
				}),
			}),
		),
		pages: defineCollection(
			asSitemapCollection({
				type: "page",
				source: "*.md",
				schema: z.object({
					title: z.string(),
					description: z.string().optional(),
					date: z.string().optional(),
					path: z.string().optional(),
				}),
			}),
		),
		series: defineCollection({
			type: "data",
			source: "series.json",
			schema: z.object({
				series: z.record(z.string(), z.array(z.string())),
			}),
		}),
	},
});
