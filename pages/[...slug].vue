<script setup lang="ts">
const route = useRoute();

// Don't match /admin paths - let them be handled by static files
if (route.path.startsWith('/admin')) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: false });
}

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first()
});

// Fetch author profile if author name exists
const authorProfile = page.value?.author ? await useAuthor(page.value.author) : null;

// Get author avatar - prioritize from author profile, then fallback to placeholder
const authorAvatar = computed(() => {
  if (authorProfile?.value) {
    const profile = authorProfile.value as { avatar?: string };
    if (profile.avatar) return profile.avatar;
  }
  // Fallback to placeholder
  const firstLetter = page.value?.author?.[0] || 'A';
  return `https://placehold.co/40x40/38bdf8/ffffff?text=${firstLetter}`;
});

// Calculate reading time (assuming average reading speed of 200 words per minute)
const readingTime = computed(() => {
  if (!page.value?.body) return 1;
  // Convert markdown body to text and count words
  const bodyText = typeof page.value.body === 'string' ? page.value.body : JSON.stringify(page.value.body);
  const words = bodyText.split(/\s+/).length;
  return Math.ceil(words / 200);
});
</script>

<template>
  <article v-if="page" class="blog-post">
    <!-- Post Header -->
    <header class="post-header">
      <h1 class="post-title">{{ page.title }}</h1>
      
      <!-- Post Meta Information -->
      <div class="post-meta-bar">
        <div class="author-info">
          <img 
            :src="authorAvatar" 
            :alt="page.author || 'Author'"
            class="author-avatar"
          >
          <span class="author-name">{{ page.author || 'Anonymous' }}</span>
        </div>
        
        <div class="meta-divider" />
        
        <div class="post-meta-items">
          <span class="meta-item">
            <Icon name="heroicons:calendar" size="16" />
            {{ new Date(page.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
          </span>
          <span class="meta-item">
            <Icon name="heroicons:clock" size="16" />
            {{ readingTime }} 分鐘閱讀
          </span>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="page.tags && page.tags.length" class="post-tags">
        <Icon name="heroicons:tag" size="16" />
        <div class="tags-list">
          <span v-for="tag in page.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </header>

    <!-- Featured Image -->
    <div v-if="page.featured_image" class="featured-image">
      <img :src="page.featured_image" :alt="page.title">
    </div>

    <!-- Post Content -->
    <div class="post-content">
      <ContentRenderer :value="page" />
    </div>

    <!-- Post Footer -->
    <footer class="post-footer">
      <div class="back-link">
        <NuxtLink to="/">
          <Icon name="heroicons:arrow-left" size="20" />
          返回所有文章
        </NuxtLink>
      </div>
    </footer>
  </article>
  
  <div v-else class="not-found">
    <Icon name="heroicons:document-magnifying-glass" size="64" />
    <h1>找不到文章</h1>
    <p>您尋找的文章不存在。</p>
    <NuxtLink to="/" class="back-button">
      <Icon name="heroicons:home" size="20" />
      返回首頁
    </NuxtLink>
  </div>
</template>

<style scoped>
.blog-post {
  background: var(--color-bg-primary);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

/* Post Header */
.post-header {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid var(--color-border-light);
}

.post-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.post-meta-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--color-primary-light);
}

.author-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.meta-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border-medium);
}

.post-meta-items {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.meta-item :deep(svg) {
  color: var(--color-primary);
}

.post-tags {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.post-tags :deep(svg) {
  color: var(--color-text-tertiary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  background: var(--color-bg-blue-tint);
  color: var(--color-primary-dark);
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid var(--color-primary-light);
}

/* Featured Image */
.featured-image {
  margin-bottom: 2.5rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.featured-image img {
  width: 100%;
  height: auto;
  display: block;
}

/* Post Content */
.post-content {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-primary);
}

.post-content :deep(h2) {
  font-size: 2rem;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border-light);
  position: relative;
}

.post-content :deep(h2)::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: var(--color-primary);
}

.post-content :deep(h2 a) {
  color: inherit;
  text-decoration: none;
}

.post-content :deep(h2 a:hover) {
  color: var(--color-primary-dark);
}

.post-content :deep(h3) {
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}

.post-content :deep(h3 a) {
  color: inherit;
  text-decoration: none;
}

.post-content :deep(h3 a:hover) {
  color: var(--color-primary-dark);
}

.post-content :deep(p) {
  margin-bottom: 1.25rem;
}

.post-content :deep(a) {
  color: var(--color-primary-dark);
  text-decoration: underline;
  text-decoration-color: var(--color-primary-light);
  text-underline-offset: 3px;
  transition: all 0.2s ease;
}

.post-content :deep(a:hover) {
  color: var(--color-primary);
  text-decoration-color: var(--color-primary);
}

.post-content :deep(ul),
.post-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.post-content :deep(li) {
  margin-bottom: 0.5rem;
}

.post-content :deep(blockquote) {
  border-left: 4px solid var(--color-accent);
  padding-left: 1.5rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  padding: 1rem 1.5rem;
  border-radius: 0 8px 8px 0;
}

.post-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.5rem 0;
  box-shadow: var(--shadow-sm);
}

.post-content :deep(pre) {
  margin: 1.5rem 0;
  background: var(--color-text-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

.post-content :deep(code) {
  font-size: 0.9em;
}

/* Post Footer */
.post-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border-light);
}

.back-link a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary-dark);
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.back-link a:hover {
  color: var(--color-primary);
  gap: 0.75rem;
}

/* Not Found */
.not-found {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--color-bg-primary);
  border-radius: 12px;
  border: 1px solid var(--color-border-light);
}

.not-found :deep(svg) {
  color: var(--color-border-medium);
  margin-bottom: 1.5rem;
}

.not-found h1 {
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.not-found p {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Responsive */
@media (max-width: 768px) {
  .blog-post {
    padding: 2rem 1.5rem;
  }

  .post-title {
    font-size: 2rem;
  }

  .post-meta-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .meta-divider {
    display: none;
  }

  .post-content {
    font-size: 1rem;
  }

  .post-content :deep(h2) {
    font-size: 1.5rem;
  }

  .post-content :deep(h3) {
    font-size: 1.25rem;
  }
}
</style>