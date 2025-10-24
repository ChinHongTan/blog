<script setup lang="ts">
// Fetch all posts for tag extraction and sidebar data
const { data: allPosts } = await useAsyncData('all-posts', () =>
  queryCollection('blog').order('date', 'DESC').all()
);

// Search query state
const searchQuery = ref('');

// Provide search query and posts to child components
provide('searchQuery', searchQuery);
provide('allPosts', allPosts);

// Current route to determine context
const route = useRoute();
const isPostPage = computed(() => route.path !== '/' && route.path !== '/about' && route.path !== '/authors');
</script>

<template>
  <div class="app-wrapper">
    <!-- Top Header -->
    <header class="main-header">
      <div class="header-content">
        <NuxtLink to="/" class="logo">
          <Icon name="heroicons:academic-cap" size="28" />
          <span>七糯糯的小站</span>
        </NuxtLink>
        
        <nav class="main-nav">
          <NuxtLink to="/">
            <Icon name="heroicons:home" size="20" />
            首頁
          </NuxtLink>
          <NuxtLink to="/about">
            <Icon name="heroicons:information-circle" size="20" />
            關於
          </NuxtLink>
          <NuxtLink to="/authors">
            <Icon name="heroicons:users" size="20" />
            作者
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- 3-Column Layout -->
    <div class="app-layout">
      <!-- Column 1: Left Sidebar -->
      <LeftSidebar />

      <!-- Column 2: Main Content -->
      <main class="main-content">
        <NuxtPage />
      </main>

      <!-- Column 3: Right Sidebar -->
      <RightSidebar :all-posts="allPosts" :is-post-page="isPostPage" :search-query="searchQuery" @update:search-query="searchQuery = $event" />
    </div>
  </div>
</template>

<style>
/* Header Styles */
.main-header {
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.logo:hover {
  color: var(--color-primary-dark);
}

.main-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.main-nav a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
  padding: 0.5rem 0;
}

.main-nav a:hover {
  color: var(--color-primary-dark);
}

/* 3-Column Grid Layout */
.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-left-width) 1fr var(--sidebar-right-width);
  max-width: 1400px;
  margin: 0 auto;
  gap: 2rem;
  padding: 0 2rem;
}

.main-content {
  padding: 3rem 2rem;
  max-width: var(--content-max-width);
  margin: 0 auto;
  width: 100%;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
  
  /* Hide sidebars on mobile/tablet */
  .app-layout > aside {
    display: none;
  }
  
  .main-content {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }
  
  .logo span {
    display: none;
  }
  
  .main-nav {
    gap: 1rem;
  }
  
  .main-nav a span {
    display: none;
  }
  
  .app-layout {
    padding: 0 1rem;
  }
  
  .main-content {
    padding: 2rem 1rem;
  }
}
</style>