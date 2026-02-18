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
                    category: z.string().optional(),
                    author_avatar: z.string().optional(),
                    date: z.string(),
                    draft: z.boolean().optional(),
                    featured_image: z.string().optional(),
                    tags: z.array(z.string()).optional(),
                    series: z.array(z.string()).optional(),
                    path: z.string().optional()
                }),
		    })
        ),
		authors: defineCollection(
            asSitemapCollection({
                type: "page",
                source: "authors/**/*.md",
                schema: z.object({
                    name: z.string(),
                    email: z.string().optional(),
                    bio: z.string().optional(),
                    avatar: z.string().optional(),
                    banner: z.string().optional(),
                    social: z.object({
                        github: z.string().optional(),
                        twitter: z.string().optional(),
                        website: z.string().optional(),
                    }).optional(),
                    path: z.string().optional()
                }),
            })
        ),
		pages: defineCollection(
            asSitemapCollection({
                type: "page",
                source: "*.md",
                schema: z.object({
                    title: z.string(),
                    description: z.string().optional(),
                    date: z.string().optional(),
                    path: z.string().optional()
                }),
            })
        ),
	},
});
