<script setup lang="ts">
const props = defineProps<{
  recentPosts?: unknown[] | null;
  searchQuery?: string;
}>();

const emit = defineEmits<{
  'update:search-query': [value: string];
}>();

const localSearchQuery = computed({
  get: () => props.searchQuery || '',
  set: (value) => emit('update:search-query', value)
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

    <!-- Table of Contents -->
    <div class="sidebar-section toc-section">
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

    <!-- Quick Navigation -->
    <div class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:squares-2x2" size="18" />
        Quick Links
      </h4>
      <nav class="quick-links">
        <a href="/">
          <Icon name="heroicons:home" size="16" />
          Home
        </a>
        <a href="/about">
          <Icon name="heroicons:information-circle" size="16" />
          About
        </a>
        <a href="/archive">
          <Icon name="heroicons:archive-box" size="16" />
          Archive
        </a>
      </nav>
    </div>

    <!-- Recent Posts -->
    <div class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:clock" size="18" />
        Recent Posts
      </h4>
      <div class="recent-posts">
        <NuxtLink 
          v-for="post in recentPosts" 
          :key="(post as any).id" 
          :to="(post as any).path"
          class="recent-post-item"
        >
          <div class="post-title">{{ (post as any).title }}</div>
          <div class="post-date">
            <Icon name="heroicons:calendar" size="14" />
            {{ new Date((post as any).date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
          </div>
        </NuxtLink>
      </div>
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

.recent-posts {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recent-post-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  text-decoration: none;
  transition: all 0.2s ease;
}

.recent-post-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.post-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.post-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
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