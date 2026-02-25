import remarkMath from 'remark-math'
import remarkDirective from 'remark-directive'
import rehypeMathjax from 'rehype-mathjax'
import remarkInfoBox from './remark-info-box.mjs'
import remarkHeadingId from './remark-heading-id.mjs'
import rehypeFigureCaption from './rehype-figure-caption.mjs'
import rehypeSpanAttributes from './rehype-span-attributes.mjs'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    githubClientId: process.env.NUXT_GITHUB_CLIENT_ID || '',
    githubClientSecret: process.env.NUXT_GITHUB_CLIENT_SECRET || '',
    cookieEncryptionSecret: process.env.NUXT_COOKIE_ENCRYPTION_SECRET || '',
    githubRepo: 'ChinHongTan/blog',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      githubClientId: process.env.NUXT_GITHUB_CLIENT_ID || '',
      githubRepo: process.env.NUXT_PUBLIC_GITHUB_REPO || 'ChinHongTan/blog',
    },
  },

  modules: [
    '@nuxtjs/sitemap',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
  ],

  site: {
    url: 'https://blog.chinono.dev',
    title: '星谷雜貨店',
    description: '记录学习和生活的点滴',
    defaultLanguage: 'zh-CN'
  },

  css: ['~/assets/css/main.css', '~/assets/css/color-spans.css'],

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark',
          },
          langs: [
            'json', 'js', 'ts', 'html', 'css', 'vue', 'diff', 'shell',
            'markdown', 'yaml', 'bash', 'ini', 'python', 'java', 'c',
            'cpp', 'csharp', 'go', 'rust', 'sql', 'graphql', 'docker',
            'xml', 'jsx', 'tsx', 'scss', 'less', 'ruby', 'php', 'swift',
            'kotlin', 'lua', 'r', 'perl', 'toml',
          ],
        },
        remarkPlugins: {
          'remark-directive': {
            instance: remarkDirective
          },
          'remark-info-box': {
            instance: remarkInfoBox
          },
          'remark-heading-id': {
            instance: remarkHeadingId
          },
          'remark-math': {
            instance: remarkMath
          }
        },
        rehypePlugins: {
          'rehype-figure-caption': {
            instance: rehypeFigureCaption
          },
          'rehype-span-attributes': {
            instance: rehypeSpanAttributes
          },
          'rehype-mathjax': {
            instance: rehypeMathjax
          }
        }
      }
    }
  },

  app: {
    head: {
      title: '星谷雜貨店',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap' },
      ],
      script: [
        { src: '/_vercel/insights/script.js', defer: true },
        { src: '/_vercel/speed-insights/script.js', defer: true },
        { src: 'https://events.vercount.one/js', defer: true },
      ]
    }
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => {
        // Handle both kebab-case (mjx-container) and PascalCase (MjxContainer)
        const lowerTag = tag.toLowerCase();
        return lowerTag.startsWith('mjx-') || 
               lowerTag === 'mjxcontainer' || 
               tag === 'MjxContainer' ||
               tag.startsWith('Mjx');
      }
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/**': {
      headers: {
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://events.vercount.one",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://waline.chinono.dev https://api.github.com https://placehold.co https://raw.githubusercontent.com https://events.vercount.one https://unpkg.com https://vitals.vercel-insights.com",
          "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
        ].join('; '),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },
})