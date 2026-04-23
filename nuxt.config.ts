import { URL } from "node:url";
import process from "node:process";
import { defineNuxtConfig } from "nuxt/config";

const remarkDirectiveFallbackPlugin = new URL(
	"./lib/markdown/remark-directive-fallback.mjs",
	import.meta.url,
).href;
const remarkInfoBoxPlugin = new URL(
	"./lib/markdown/remark-info-box.mjs",
	import.meta.url,
).href;
const remarkHeadingIdPlugin = new URL(
	"./lib/markdown/remark-heading-id.mjs",
	import.meta.url,
).href;
const rehypeFigureCaptionPlugin = new URL(
	"./lib/markdown/rehype-figure-caption.mjs",
	import.meta.url,
).href;
const rehypeSpanAttributesPlugin = new URL(
	"./lib/markdown/rehype-span-attributes.mjs",
	import.meta.url,
).href;
const remarkCustomHtmlPlugin = new URL(
	"./lib/markdown/remark-custom-html.mjs",
	import.meta.url,
).href;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },

	runtimeConfig: {
		githubClientId: process.env.NUXT_GITHUB_CLIENT_ID || "",
		githubClientSecret: process.env.NUXT_GITHUB_CLIENT_SECRET || "",
		cookieEncryptionSecret: process.env.NUXT_COOKIE_ENCRYPTION_SECRET || "",
		githubRepo: "ChinHongTan/blog",
		githubBranch: process.env.NUXT_GITHUB_BRANCH || "main",
		public: {
			siteUrl:
				process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
			githubClientId: process.env.NUXT_GITHUB_CLIENT_ID || "",
			githubRepo:
				process.env.NUXT_PUBLIC_GITHUB_REPO || "ChinHongTan/blog",
			githubBranch:
				process.env.NUXT_PUBLIC_GITHUB_BRANCH ||
				process.env.NUXT_GITHUB_BRANCH ||
				"main",
		},
	},

	modules: [
		"@nuxtjs/sitemap",
		"@nuxt/content",
		"@nuxt/eslint",
		"@nuxt/icon",
		"@nuxt/image",
	],

	image: {
		provider: process.env.VERCEL ? "vercel" : "ipx",
		domains: ["raw.githubusercontent.com"],
		format: ["webp"],
	},

	hooks: {
		// Filename is the URL. Avoids @nuxt/content's default slugifier,
		// which strips CJK characters and collides paths like
		// "Motor-Learning" and "Motor-Learning小兒（二）".
		"content:file:afterParse"(ctx) {
			const stem = ctx.content.stem;
			if (typeof stem === "string" && stem.length > 0) {
				ctx.content.path = `/${stem}`;
			}
		},
	},

	site: {
		url: "https://blog.chinono.dev",
		title: "星谷雜貨店",
		description: "记录学习和生活的点滴",
		defaultLanguage: "zh-CN",
	},

	css: ["~/assets/css/main.css", "~/assets/css/color-spans.css"],

	content: {
		experimental: {
			sqliteConnector: "native",
		},
		build: {
			markdown: {
				highlight: {
					theme: {
						default: "github-light",
						dark: "github-dark",
					},
					langs: [
						"json",
						"js",
						"ts",
						"html",
						"css",
						"vue",
						"diff",
						"shell",
						"markdown",
						"yaml",
						"bash",
						"ini",
						"python",
						"java",
						"c",
						"cpp",
						"csharp",
						"go",
						"rust",
						"sql",
						"graphql",
						"docker",
						"xml",
						"jsx",
						"tsx",
						"scss",
						"less",
						"ruby",
						"php",
						"swift",
						"kotlin",
						"lua",
						"r",
						"perl",
						"toml",
					],
				},
				remarkPlugins: {
					"remark-directive": {},
					[remarkDirectiveFallbackPlugin]: {},
					[remarkInfoBoxPlugin]: {},
					[remarkHeadingIdPlugin]: {},
					[remarkCustomHtmlPlugin]: {},
					"remark-math": {},
				},
				rehypePlugins: {
					[rehypeFigureCaptionPlugin]: {},
					[rehypeSpanAttributesPlugin]: {},
					"rehype-mathjax": {},
				},
			},
		},
	},

	vite: {
		optimizeDeps: {
			exclude: ["#app-manifest"],
		},
	},

	app: {
		head: {
			title: "星谷雜貨店",
			link: [
				{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
				{ rel: "preconnect", href: "https://fonts.googleapis.com" },
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossorigin: "",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
				},
			],
			script: [{ src: "https://events.vercount.one/js", defer: true }],
		},
	},

	vue: {
		compilerOptions: {
			isCustomElement: (tag) => {
				// Handle both kebab-case (mjx-container) and PascalCase (MjxContainer)
				const lowerTag = tag.toLowerCase();
				return (
					lowerTag.startsWith("mjx-") ||
					lowerTag === "mjxcontainer" ||
					tag === "MjxContainer" ||
					tag.startsWith("Mjx")
				);
			},
		},
	},

	routeRules: {
		"/": { prerender: true },
		"/**": {
			headers: {
				"Content-Security-Policy": [
					"default-src 'self'",
					"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://events.vercount.one https://va.vercel-scripts.com",
					"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
					"font-src 'self' data: https://fonts.gstatic.com",
					"img-src 'self' data: https: blob:",
					"connect-src 'self' blob: https://waline.chinono.dev https://api.github.com https://api.iconify.design https://placehold.co https://raw.githubusercontent.com https://events.vercount.one https://unpkg.com https://vitals.vercel-insights.com",
					"frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
				].join("; "),
				"X-Content-Type-Options": "nosniff",
				"X-Frame-Options": "SAMEORIGIN",
				"Referrer-Policy": "strict-origin-when-cross-origin",
			},
		},
	},

	nitro: {
		prerender: {
			crawlLinks: true,
			failOnError: false,
		},
	},
});
