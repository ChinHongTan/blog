<script setup lang="ts">
const props = defineProps<{
  allPosts?: unknown[] | null;
  isPostPage?: boolean;
  searchQuery?: string;
}>();

const emit = defineEmits<{
  'update:search-query': [value: string];
}>();

const localSearchQuery = computed({
  get: () => props.searchQuery || '',
  set: (value) => emit('update:search-query', value)
});

// Group posts by year
const postsByYear = computed(() => {
  if (!props.allPosts) return [];
  const yearMap = new Map<string, unknown[]>();
  
  props.allPosts.forEach((post: unknown) => {
    const postData = post as { date: string };
    const year = new Date(postData.date).getFullYear().toString();
    if (!yearMap.has(year)) {
      yearMap.set(year, []);
    }
    yearMap.get(year)?.push(post);
  });
  
  // Convert to array and sort by year descending
  return Array.from(yearMap.entries())
    .map(([year, posts]) => ({ year, count: posts.length }))
    .sort((a, b) => Number(b.year) - Number(a.year));
});

// Get unique authors
const authors = computed(() => {
  if (!props.allPosts) return [];
  const authorMap = new Map<string, number>();
  
  props.allPosts.forEach((post: unknown) => {
    const postData = post as { author?: string };
    if (postData.author) {
      authorMap.set(postData.author, (authorMap.get(postData.author) || 0) + 1);
    }
  });
  
  return Array.from(authorMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
});
</script>

<template>
  <aside class="right-sidebar">
    <!-- Search Bar -->
    <div class="sidebar-section search-section">
      <div class="search-bar">
        <Icon name="heroicons:magnifying-glass" size="20" />
        <input 
          v-model="localSearchQuery"
          type="text" 
          placeholder="Search posts..."
          class="search-input"
        >
      </div>
    </div>

    <!-- Table of Contents - Only show on post pages -->
    <div v-if="isPostPage" class="sidebar-section toc-section">
      <h4 class="section-title">
        <Icon name="heroicons:list-bullet" size="18" />
        On This Page
      </h4>
      <nav class="toc-links">
        <a href="#introduction">Introduction</a>
        <a href="#main-content">Main Content</a>
        <a href="#conclusion">Conclusion</a>
      </nav>
    </div>

    <!-- Posts by Year -->
    <div v-if="postsByYear.length > 0" class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:calendar" size="18" />
        Archive
      </h4>
      <nav class="archive-links">
        <NuxtLink 
          v-for="{ year, count } in postsByYear" 
          :key="year"
          :to="`/?year=${year}`"
          class="archive-item"
        >
          <Icon name="heroicons:chevron-right" size="16" />
          <span>{{ year }}</span>
          <span class="count">({{ count }})</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Authors -->
    <div v-if="authors.length > 0" class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:users" size="18" />
        Authors
      </h4>
      <nav class="author-links">
        <NuxtLink 
          v-for="{ name, count } in authors" 
          :key="name"
          :to="`/?author=${encodeURIComponent(name)}`"
          class="author-item"
        >
          <Icon name="heroicons:user-circle" size="16" />
          <span>{{ name }}</span>
          <span class="count">({{ count }})</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Quick Navigation -->
    <div class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:squares-2x2" size="18" />
        Quick Links
      </h4>
      <nav class="quick-links">
        <NuxtLink to="/">
          <Icon name="heroicons:home" size="16" />
          Home
        </NuxtLink>
        <NuxtLink to="/about">
          <Icon name="heroicons:information-circle" size="16" />
          About
        </NuxtLink>
        <NuxtLink to="/authors">
          <Icon name="heroicons:users" size="16" />
          Authors
        </NuxtLink>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.right-sidebar {
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border-light);
  padding: 2rem 1.5rem;
  position: sticky;
  top: calc(var(--header-height) + 2rem);
  height: calc(100vh - var(--header-height) - 4rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Search Bar */
.search-section {
  padding: 0;
  margin: 0;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border-light);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.search-bar:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
  background: var(--color-bg-primary);
}

.search-bar :deep(svg) {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.9rem;
  font-family: var(--font-body);
  color: var(--color-text-primary);
  background: transparent;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.toc-links,
.quick-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toc-links a,
.quick-links a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toc-links a:hover,
.quick-links a:hover {
  color: var(--color-primary-dark);
  background: var(--color-bg-blue-tint);
  padding-left: 1rem;
}

/* Archive Links */
.archive-links,
.author-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.archive-item,
.author-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.archive-item:hover,
.author-item:hover {
  color: var(--color-primary-dark);
  background: var(--color-bg-blue-tint);
  padding-left: 1rem;
}

.archive-item .count,
.author-item .count {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
}

/* Scrollbar styling */
.right-sidebar::-webkit-scrollbar {
  width: 6px;
}

.right-sidebar::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

.right-sidebar::-webkit-scrollbar-thumb {
  background: var(--color-border-medium);
  border-radius: 3px;
}

.right-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}
</style>