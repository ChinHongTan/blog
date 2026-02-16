import remarkMath from 'remark-math'
import rehypeMathjax from 'rehype-mathjax'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    githubClientId: process.env.NUXT_GITHUB_CLIENT_ID || '',
    githubClientSecret: process.env.NUXT_GITHUB_CLIENT_SECRET || '',
    githubRepo: 'ChinHongTan/blog', // owner/repo
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
    title: '七糯糯的小站',
    description: '记录学习和生活的点滴',
    defaultLanguage: 'zh-CN'
  },

  css: ['~/assets/css/main.css'],

  content: {
    build: {
      markdown: {
        remarkPlugins: {
          'remark-math': {
            instance: remarkMath
          }
        },
        rehypePlugins: {
          'rehype-mathjax': {
            instance: rehypeMathjax
          }
        }
      }
    }
  },

  app: {
    head: {
      title: '七糯糯的小站',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
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
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },
})