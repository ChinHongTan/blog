import { defineCollection, defineContentConfig } from "@nuxt/content";
import { z } from "zod";

export default defineContentConfig({
	collections: {
		blog: defineCollection({
			type: "page",
			source: "blog/**/*.md",
			schema: z.object({
				title: z.string().optional(),
				description: z.string().optional(),
				date: z.string(),
				featured_image: z.string().optional(),
			}),
		}),
	},
});
