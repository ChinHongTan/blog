<script setup lang="ts">
const { data: posts } = await useAsyncData("posts", () =>
  queryCollection('blog').order('date', 'DESC').all()
);

// Get search query from app.vue
const searchQuery = inject('searchQuery', ref(''));

const filteredPosts = computed(() => {
  if (!searchQuery.value) return posts.value;
  return posts.value?.filter(post => 
    post.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

useSeoMeta({
  title: 'Chinono',
  description: 'test'
});
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          Hey there! This is <span class="highlight">Chinono</span>
        </h1>
        <p class="hero-description">
          This is where we share our daily adventures, cool discoveries, achievements, and fun moments. From work stuff to gaming wins - it's all here!
        </p>
      </div>
    </section>

    <!-- Blog Posts List -->
    <section class="posts-section">
      <h2 class="section-heading">
        <Icon name="heroicons:newspaper" size="28" />
        Recent Updates
      </h2>

      <div v-if="filteredPosts && filteredPosts.length > 0" class="posts-grid">
        <article v-for="post in filteredPosts" :key="post.id" class="post-card">
          <NuxtLink :to="post.path" class="post-link">
            <div v-if="post.featured_image" class="post-image">
              <img :src="post.featured_image" :alt="post.title">
            </div>
            <div class="post-content">
              <h3 class="post-title">{{ post.title }}</h3>
              <p v-if="post.description" class="post-description">
                {{ post.description }}
              </p>
              <div class="post-meta">
                <span class="meta-item">
                  <Icon name="heroicons:calendar" size="16" />
                  {{ new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
                </span>
                <span v-if="post.author" class="meta-item">
                  <Icon name="heroicons:user" size="16" />
                  {{ post.author }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>

      <div v-else class="no-results">
        <Icon name="heroicons:magnifying-glass-circle" size="48" />
        <p>Nothing found. Try a different search!</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--color-bg-blue-tint) 0%, var(--color-bg-primary) 100%);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-lg);
}

.hero-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.highlight {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.15rem;
  color: var(--color-text-secondary);
  max-width: 650px;
  margin: 0 auto;
  line-height: 1.7;
}

/* Posts Section */
.section-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  color: var(--color-text-primary);
  margin-bottom: 1.5rem;
}

.section-heading :deep(svg) {
  color: var(--color-primary);
}

.posts-grid {
  display: grid;
  gap: 1.5rem;
}

.post-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
}

.post-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.post-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--color-bg-tertiary);
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-card:hover .post-image img {
  transform: scale(1.05);
}

.post-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.post-title {
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
  margin: 0;
}

.post-description {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.post-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-text-tertiary);
}

.meta-item :deep(svg) {
  color: var(--color-primary);
}

/* No Results */
.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-tertiary);
}

.no-results :deep(svg) {
  color: var(--color-border-medium);
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    padding: 2rem 1.5rem;
  }

  .hero-title {
    font-size: 1.85rem;
  }

  .hero-description {
    font-size: 1rem;
  }
}
</style>