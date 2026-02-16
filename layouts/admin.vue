<template>
  <div class="admin-layout">
    <aside class="admin-sidebar admin-sidebar-float">
      <nav class="admin-nav">
        <NuxtLink to="/admin" class="admin-nav-link" active-class="router-link-active">
          控制台
        </NuxtLink>
        <NuxtLink to="/admin/posts" class="admin-nav-link" active-class="router-link-active">
          文章
        </NuxtLink>
      </nav>
    </aside>
    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// Layout only: floating sidebar + main content. Lists live in /admin/posts and /admin/authors.
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: calc(100vh - var(--header-height, 70px));
  padding: 1.5rem;
  gap: 1.5rem;
}
.admin-sidebar-float {
  position: sticky;
  top: calc(var(--header-height, 70px) + 1rem);
  align-self: flex-start;
  width: 160px;
  flex-shrink: 0;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
  padding: 0.75rem 0;
  box-shadow: var(--shadow-md);
}
.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.admin-nav-link {
  padding: 0.5rem 1rem;
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.9375rem;
  border-left: 3px solid transparent;
  margin-left: 0;
  border-radius: 0 4px 4px 0;
}
.admin-nav-link:hover {
  background: var(--color-bg-tertiary);
}
.admin-nav-link.router-link-active {
  background: var(--color-bg-blue-tint);
  border-left-color: var(--color-primary);
  color: var(--color-primary);
}
.admin-main {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
</style>
