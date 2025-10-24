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
const isPostPage = computed(() => route.path !== '/' && route.path !== '/about' && route.path !== '/authors' && route.path !== '/code-of-conduct');

// Get current page data to determine author
const { data: currentPage } = await useAsyncData('current-page', async () => {
  if (isPostPage.value && route.path !== '/') {
    return await queryCollection('blog').path(route.path).first();
  }
  return Promise.resolve(null);
}, {
  watch: [() => route.path]
});

const currentAuthor = computed(() => {
  if (currentPage.value) {
    const page = currentPage.value as { author?: string };
    return page.author || null;
  }
  return null;
});
</script>

<template>
  <div class="app-wrapper">
    <!-- Top Header -->
    <header class="main-header">
      <div class="header-content">
        <NuxtLink to="/" class="logo">
          <!-- Option 1: Profile Picture (Current) -->
          <img src="/images/uploads/103467998_p0 copy.png" alt="Logo" class="logo-image">
          
          <!-- Option 2: Remove icon completely - just delete the img/Icon line above -->
          
          <!-- Option 3: Use an icon instead:
          <Icon name="heroicons:academic-cap" size="28" />
          -->
          
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

    <div class="app-layout">
      <LeftSidebar :current-author="currentAuthor" />

      <main class="main-content">
        <NuxtPage />

        <footer class="site-footer">
          <div class="footer-links">
            <NuxtLink to="/code-of-conduct">行為準則</NuxtLink>
            <span class="separator">•</span>
            <a href="https://github.com/ChinHongTan/blog" target="_blank" rel="noopener">GitHub</a>
          </div>
          <a href="https://www.netlify.com" class="netlify-badge" target="_blank" rel="noopener">
            <img src="https://www.netlify.com/v3/img/components/netlify-color-bg.svg" alt="Deploys by Netlify">
          </a>
        </footer>
      </main>

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

.logo-image {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-primary-light);
  transition: all 0.2s ease;
}

.logo:hover {
  color: var(--color-primary-dark);
}

.logo:hover .logo-image {
  border-color: var(--color-primary);
  transform: scale(1.05);
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

/* Footer Styles */
.site-footer {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border-light);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.footer-links a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--color-primary-dark);
}

.footer-links .separator {
  color: var(--color-border-medium);
}

.netlify-badge {
  display: inline-block;
  opacity: 0.7;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.netlify-badge:hover {
  opacity: 1;
  transform: translateY(-2px);
}

.netlify-badge img {
  height: 40px;
  width: auto;
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