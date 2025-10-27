<script setup lang="ts">
type AuthorCollectionItem = {
  name?: string;
  avatar?: string;
  [key: string]: unknown;
};

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

function fallbackAvatar(label: string, size = 48) {
  const safeLabel = label?.trim();
  const initial = (safeLabel ? safeLabel[0] : 'A')?.toUpperCase() ?? 'A';
  return `https://placehold.co/${size}x${size}/38bdf8/ffffff?text=${initial}`;
}

const { data: authorEntries } = await useAsyncData('sidebar-authors', () =>
  queryCollection('authors').all()
);

const authorDirectory = computed<Record<string, AuthorCollectionItem>>(() => {
  const directory: Record<string, AuthorCollectionItem> = {};
  const records = (authorEntries.value ?? []) as unknown as AuthorCollectionItem[];
  records.forEach((entry) => {
    if (entry?.name) {
      directory[entry.name] = entry;
    }
  });
  return directory;
});

// TOC state
const toc = ref<{ id: string; text: string; level: number }[]>([]);
const activeId = ref('');

// Extract TOC from DOM
const extractTOC = () => {
  if (!props.isPostPage) {
    toc.value = [];
    return;
  }

  const headings = document.querySelectorAll('.post-content h2, .post-content h3');
  const links: { id: string; text: string; level: number }[] = [];
  
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    const text = heading.textContent?.trim() || '';
    let id = heading.id;
    
    // If no ID, create one
    if (!id) {
      id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
      heading.id = id;
    }
    
    links.push({ id, text, level });
  });
  
  toc.value = links;
};

// Smooth scroll to heading
const scrollToHeading = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    const headerOffset = 100; // Account for fixed header
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    
    // Update active ID
    activeId.value = id;
  }
};

// Update active heading based on scroll position
const setupScrollObserver = () => {
  if (typeof window === 'undefined' || !props.isPostPage) return;
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id;
        }
      });
    },
    {
      rootMargin: '-80px 0px -80% 0px'
    }
  );

  // Observe all h2 and h3 elements
  const headings = document.querySelectorAll('.post-content h2, .post-content h3');
  headings.forEach((heading) => observer.observe(heading));

  onUnmounted(() => {
    headings.forEach((heading) => observer.unobserve(heading));
  });
};

// Watch for route changes and extract TOC
const route = useRoute();
watch(() => route.path, () => {
  // Wait for content to render
  nextTick(() => {
    extractTOC();
    setupScrollObserver();
  });
}, { immediate: false });

// Extract TOC on mount
onMounted(() => {
  nextTick(() => {
    extractTOC();
    setupScrollObserver();
  });
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
    .map(([name, count]) => ({
      name,
      count,
      avatar: authorDirectory.value[name]?.avatar ?? fallbackAvatar(name, 40),
    }))
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
          placeholder="搜尋文章..."
          class="search-input"
        >
      </div>
    </div>

    <!-- Table of Contents - Only show on post pages -->
    <div v-if="isPostPage && toc.length > 0" class="sidebar-section toc-section">
      <h4 class="section-title">
        <Icon name="heroicons:list-bullet" size="18" />
        本頁內容
      </h4>
      <nav class="toc-links">
        <a 
          v-for="link in toc" 
          :key="link.id"
          :href="`#${link.id}`"
          :class="['toc-link', `level-${link.level}`, { active: activeId === link.id }]"
          @click.prevent="scrollToHeading(link.id)"
        >
          {{ link.text }}
        </a>
      </nav>
    </div>

    <!-- Posts by Year -->
    <div v-if="postsByYear.length > 0" class="sidebar-section">
      <h4 class="section-title">
        <Icon name="heroicons:calendar" size="18" />
        文章存檔
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
        作者
      </h4>
      <nav class="author-links">
        <NuxtLink 
          v-for="{ name, count, avatar } in authors" 
          :key="name"
          :to="`/?author=${encodeURIComponent(name)}`"
          class="author-item"
        >
          <img :src="avatar" :alt="`${name} Avatar`" class="author-avatar">
          <div class="author-meta">
            <span class="author-name">{{ name }}</span>
            <span class="author-count">({{ count }})</span>
          </div>
        </NuxtLink>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.right-sidebar {
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
  padding: 0.6rem 0.9rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 999px;
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
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary-light);
}

.toc-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toc-links a {
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

.toc-links a.level-3 {
  padding-left: 1.5rem;
  font-size: 0.85rem;
}

.toc-links a.active {
  color: var(--color-primary-dark);
  background: var(--color-bg-secondary);
  font-weight: 500;
  border-left: 3px solid var(--color-primary);
}

.toc-links a:hover {
  color: var(--color-primary-dark);
  background: var(--color-bg-blue-tint);
  padding-left: 1rem;
}

.toc-links a.level-3:hover {
  padding-left: 2rem;
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
  gap: 0.6rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.archive-item:hover,
.author-item:hover {
  color: var(--color-primary-dark);
  background: var(--color-bg-blue-tint);
  padding-left: 1rem;
}

.archive-item .count {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
}

.author-item {
  gap: 0.55rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.author-meta {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  color: var(--color-text-secondary);
}

.author-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.author-count {
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
}
/* Scrollbar styling */
.right-sidebar::-webkit-scrollbar {
  width: 6px;
}

.right-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.right-sidebar::-webkit-scrollbar-thumb {
  background: var(--color-border-medium);
  border-radius: 3px;
}

.right-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

/* Responsive - Hide sidebar on mobile/tablet */
@media (max-width: 1200px) {
  .right-sidebar {
    display: none;
  }
}
</style>