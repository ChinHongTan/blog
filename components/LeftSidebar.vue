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

    <!-- Show site navigation links when on homepage -->
    <div v-if="!isShowingAuthor" class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:link" size="18" />
        站內連結
      </h4>
      <nav class="sidebar-links">
        <NuxtLink to="/about">
          <Icon name="heroicons:information-circle" size="16" />
          關於本站
        </NuxtLink>
        <NuxtLink to="/authors">
          <Icon name="heroicons:users" size="16" />
          所有作者
        </NuxtLink>
        <NuxtLink to="/code-of-conduct">
          <Icon name="heroicons:document-text" size="16" />
          行為準則
        </NuxtLink>
        <a href="https://github.com/ChinHongTan/blog" target="_blank" rel="noopener noreferrer">
          <Icon name="simple-icons:github" size="16" />
          網站原始碼
        </a>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.left-sidebar {
  background: var(--color-bg-primary);
  border-right: 1px solid var(--color-border-light);
  padding: 2rem 1.5rem;
  position: sticky;
  top: calc(var(--header-height) + 2rem);
  height: calc(100vh - var(--header-height) - 4rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.author-info {
  text-align: center;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border-light);
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 0.5rem;
  border: 3px solid var(--color-primary-light);
  box-shadow: var(--shadow-md);
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

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-primary-light);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-block;
  padding: 0.4rem 0.75rem;
  background: var(--color-bg-blue-tint);
  color: var(--color-primary-dark);
  border-radius: 20px;
  font-size: 0.85rem;
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
  background: var(--color-bg-blue-tint);
  padding-left: 1rem;
}

/* Scrollbar styling */
.left-sidebar::-webkit-scrollbar {
  width: 6px;
}

.left-sidebar::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
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