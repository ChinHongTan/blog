import remarkMath from 'remark-math'
import rehypeMathjax from 'rehype-mathjax'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image'
  ],

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
    // Ensure admin static files are served correctly
    '/admin/**': { ssr: false },
  }
})