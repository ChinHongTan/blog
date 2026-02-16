<template>
  <div class="admin-list-page">
    <div class="admin-list-bar">
      <h2 class="admin-list-title">文章</h2>
      <NuxtLink to="/admin/editor?type=post" class="admin-list-add-btn">新增</NuxtLink>
    </div>
    <div v-if="loading" class="admin-list-loading">載入中…</div>
    <ul v-else class="admin-list">
      <li v-for="p in postList" :key="p.path" class="admin-list-item">
        <NuxtLink :to="`/admin/editor?type=post&path=${encodeURIComponent(p.path)}`" class="admin-list-link">
          {{ p.name }}
        </NuxtLink>
      </li>
      <li v-if="postList.length === 0" class="admin-list-empty">尚無文章</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const postList = ref<{ name: string; path: string; stem: string }[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    postList.value = await $fetch<{ name: string; path: string; stem: string }[]>("/api/admin/repo/list?path=content/blog").catch(() => []);
    if (!Array.isArray(postList.value)) postList.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.admin-list-page {
  max-width: 900px;
  margin: 0 auto;
}
.admin-list-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}
.admin-list-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}
.admin-list-add-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  background: var(--color-primary);
  border-radius: 0.375rem;
  text-decoration: none;
}
.admin-list-add-btn:hover {
  background: var(--color-primary-dark);
}
.admin-list-loading {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-tertiary);
}
.admin-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.admin-list-item {
  margin-bottom: 0.25rem;
}
.admin-list-link {
  display: block;
  padding: 0.5rem 0.75rem;
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: 0.375rem;
  font-size: 0.9375rem;
}
.admin-list-link:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}
.admin-list-empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 0.9375rem;
}
</style>
