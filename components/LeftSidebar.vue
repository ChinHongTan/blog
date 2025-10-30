<script setup lang="ts">
// Props for dynamic author display
const props = defineProps<{
  currentAuthor?: string | null;
}>();

// Get all posts from parent
const allPosts = inject<{ value: unknown[] | null }>('allPosts', ref(null));

// Fetch author profile based on currentAuthor prop
const authorProfile = ref<{ name?: string; bio?: string; avatar?: string; social?: { github?: string; twitter?: string; website?: string } } | null>(null);

// Watch for changes in currentAuthor and fetch profile
watch(() => props.currentAuthor, async (authorName) => {
  if (authorName) {
    const profile = await useAuthor(authorName);
    authorProfile.value = profile?.value || null;
  } else {
    // Default to main site info when on homepage
    authorProfile.value = {
      name: '七糯糯的小站',
      bio: '分享生活點滴的小小天地。',
      avatar: '/images/uploads/103467998_p0 copy.png'
    };
  }
}, { immediate: true });

// Check if we're on a post page (showing specific author)
const isShowingAuthor = computed(() => !!props.currentAuthor);

const totalPosts = computed(() => {
  const posts = allPosts.value;
  return Array.isArray(posts) ? posts.length : 0;
});

const totalAuthors = computed(() => {
  const posts = allPosts.value;
  if (!Array.isArray(posts)) return 0;
  const authors = new Set<string>();
  posts.forEach((entry: unknown) => {
    const post = entry as { author?: string };
    if (post.author) {
      authors.add(post.author);
    }
  });
  return authors.size;
});

const totalCategories = computed(() => {
  const posts = allPosts.value;
  if (!Array.isArray(posts)) return 0;
  const categories = new Set<string>();
  posts.forEach((entry: unknown) => {
    const post = entry as { category?: string | null };
    if (post.category) {
      categories.add(post.category);
    }
  });
  return categories.size;
});

const postCategories = computed(() => {
  const posts = allPosts.value;
  if (!Array.isArray(posts)) return [];
  const categoryCounts = new Map<string, number>();

  posts.forEach((entry: unknown) => {
    const post = entry as { category?: string | null };
    if (post.category) {
      categoryCounts.set(post.category, (categoryCounts.get(post.category) || 0) + 1);
    }
  });

  return Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
});

// Computed properties for display
const displayName = computed(() => authorProfile.value?.name || '七糯糯');
const displayBio = computed(() => authorProfile.value?.bio || '分享生活點滴的小小天地。');
const displayAvatar = computed(() => {
  if (authorProfile.value?.avatar) return authorProfile.value.avatar;
  const firstLetter = displayName.value[0] || '七';
  return `https://placehold.co/100x100/38bdf8/ffffff?text=${firstLetter}`;
});

// Extract top 8 tags with counts
const topTags = computed(() => {
  if (!allPosts.value) return [];
  const tagCounts = new Map<string, number>();
  
  allPosts.value.forEach((post: unknown) => {
    const postData = post as { tags?: string[] };
    if (postData.tags && Array.isArray(postData.tags)) {
      postData.tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });
  
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 tags
});
</script>

<template>
  <aside class="left-sidebar">
    <div class="sidebar-section author-info">
      <img :src="displayAvatar" :alt="`${displayName} Avatar`" class="avatar">
      <h3 class="author-name">{{ displayName }}</h3>
      <p class="author-bio">
        {{ displayBio }}
      </p>
      <div v-if="!isShowingAuthor" class="site-stats">
        <div class="site-stat">
          <span class="site-stat-value">{{ totalPosts }}</span>
          <span class="site-stat-label">文章</span>
        </div>
        <div class="site-stat">
          <span class="site-stat-value">{{ totalAuthors }}</span>
          <span class="site-stat-label">作者</span>
        </div>
        <div class="site-stat">
          <span class="site-stat-value">{{ totalCategories }}</span>
          <span class="site-stat-label">分類</span>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:tag" size="18" />
        熱門標籤
      </h4>
      <div v-if="topTags.length > 0" class="tags">
        <NuxtLink 
          v-for="{ tag, count } in topTags" 
          :key="tag"
          :to="`/?tag=${encodeURIComponent(tag)}`" 
          class="tag"
        >
          {{ tag }} <span class="tag-count">({{ count }})</span>
        </NuxtLink>
      </div>
      <p v-else class="empty-state">尚無標籤</p>
    </div>

    <div v-if="postCategories.length > 0" class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:rectangle-stack" size="18" />
        文章分類
      </h4>
      <div class="categories">
        <NuxtLink
          v-for="{ category, count } in postCategories"
          :key="category"
          :to="`/?category=${encodeURIComponent(category)}`"
          class="category-link"
        >
          <span>{{ category }}</span>
          <span class="category-count">({{ count }})</span>
        </NuxtLink>
      </div>
    </div>

    <div v-if="isShowingAuthor && authorProfile?.social" class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:link" size="18" />
        作者連結
      </h4>
      <nav class="sidebar-links">
        <a v-if="authorProfile.social.github" :href="authorProfile.social.github" target="_blank" rel="noopener noreferrer">
          <Icon name="simple-icons:github" size="16" />
          GitHub
        </a>
        <a v-if="authorProfile.social.twitter" :href="authorProfile.social.twitter" target="_blank" rel="noopener noreferrer">
          <Icon name="simple-icons:x" size="16" />
          Twitter
        </a>
        <a v-if="authorProfile.social.website" :href="authorProfile.social.website" target="_blank" rel="noopener noreferrer">
          <Icon name="heroicons:globe-alt" size="16" />
          個人網站
        </a>
      </nav>
    </div>

  </aside>
</template>

<style scoped>
.left-sidebar {
  background: var(--panel-bg);
  border: 1px solid var(--color-border-light);
  padding: 1.5rem 1.25rem;
  position: sticky;
  top: calc(var(--header-height) + 1.5rem);
  max-height: calc(100vh - var(--header-height) - 3rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  -webkit-backdrop-filter: saturate(1.2) blur(var(--glass-blur));
  backdrop-filter: saturate(1.2) blur(var(--glass-blur));
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.author-info {
  text-align: center;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid var(--color-primary-light);
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  margin: 0 auto 0.5rem;
  border: 3px solid var(--color-primary-light);
  box-shadow: var(--shadow-sm);
  object-fit: cover;
  aspect-ratio: 1 / 1;
}

.author-name {
  color: var(--color-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.author-bio {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.site-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.site-stat {
  background: color-mix(in srgb, var(--color-bg-primary) 94%, transparent);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 0.45rem 0.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.site-stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.site-stat-label {
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary-light);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.35rem 0.7rem;
  background: var(--color-bg-blue-tint);
  color: var(--color-primary-dark);
  border-radius: 999px;
  font-size: 0.83rem;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid var(--color-primary-light);
  transition: all 0.2s ease;
}

.tag:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.tag-count {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-left: 0.2rem;
}

.categories {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.category-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-bg-primary) 96%, transparent);
  border: 1px solid var(--color-border-light);
  transition: all 0.2s ease;
}

.category-link:hover {
  color: var(--color-primary-dark);
  background: var(--color-bg-blue-tint);
  border-color: var(--color-primary-light);
  transform: translateX(4px);
}

.category-count {
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
}

.sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar-links a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sidebar-links a:hover {
  color: var(--color-primary-dark);
  background: var(--color-bg-secondary);
  padding-left: 1rem;
}

/* Scrollbar styling */
.left-sidebar::-webkit-scrollbar {
  width: 6px;
}

.left-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.left-sidebar::-webkit-scrollbar-thumb {
  background: var(--color-border-medium);
  border-radius: 3px;
}

.left-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

/* Responsive - Hide sidebar on mobile/tablet */
@media (max-width: 1200px) {
  .left-sidebar {
    display: none;
  }
}
</style>