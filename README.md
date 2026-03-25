# 星谷雜貨店 (chinono-blog)

A personal blog built with [Nuxt 3](https://nuxt.com) and [Nuxt Content v3](https://content.nuxt.com), featuring a built-in admin panel with a WYSIWYG editor.

**Live site:** [blog.chinono.dev](https://blog.chinono.dev)

## Features

- Markdown-based content with custom remark/rehype plugins (info boxes, math, citations, colored spans)
- Admin panel with GitHub OAuth authentication
- Milkdown WYSIWYG editor for creating and editing posts
- Draft management with local storage recovery
- Image upload via GitHub API
- Author profiles and series support
- Dark/light theme toggle
- Waline comment system
- Sitemap generation
- Full-text search

## Setup

### Prerequisites

- Node.js 18+
- A GitHub OAuth App (for admin panel)

### Environment Variables

Create a `.env` file in the project root:

```env
NUXT_GITHUB_CLIENT_ID=your_github_oauth_client_id
NUXT_GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NUXT_COOKIE_ENCRYPTION_SECRET=a_random_32_char_secret_for_prod
NUXT_PUBLIC_SITE_URL=http://localhost:3000
NUXT_PUBLIC_GITHUB_REPO=owner/repo
```

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The site runs at `http://localhost:3000`. The admin panel is at `/admin`.

### Build for Production

```bash
# SSR build
npm run build

# Static site generation
npm run generate

# Preview the production build
npm run preview
```

## Project Structure

```
├── assets/css/          # Global stylesheets
├── components/          # Vue components (SiteHeader, SiteFooter, admin/, content/)
├── composables/         # Shared composables (auth, theme, toast, editor helpers)
├── content/             # Markdown content (blog/, authors/, drafts/)
├── layouts/             # Nuxt layouts (default, admin)
├── lib/                 # Milkdown editor plugins
├── pages/               # Route pages (index, [...slug], admin/, author/, series/)
├── plugins/             # Nuxt plugins (theme, mathjax, footnote highlights)
├── public/              # Static assets
├── server/              # Server API routes (admin auth, repo CRUD)
├── types/               # Shared TypeScript types
├── utils/               # Remark plugins
└── nuxt.config.ts       # Nuxt configuration
```

## Privacy Notes

- Author profiles no longer store or publish email fields in frontmatter.
- Waline client is configured to use only nickname and optional link metadata (no email field in the widget).
- Historical email data in the external Waline backend is not removed by this repository. Purge it from the Waline admin/database directly.
- Historical email exposure may still exist in Git history or search-engine caches from older deployments.

## License

[MIT](LICENSE) - Copyright 2025 Chin Hong Tan
