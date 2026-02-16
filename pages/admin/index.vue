<template>
  <div>
    <div v-if="loading" class="admin-loading">載入中…</div>
    <div v-else-if="!user" class="admin-login">
      <h1>後台</h1>
      <p>請使用 GitHub 登入以編輯文章與作者。</p>
      <button type="button" class="admin-btn admin-btn-primary" @click="login">使用 GitHub 登入</button>
      <p class="admin-login-note">您需要具備部落格儲存庫的寫入權限。</p>
    </div>
    <div v-else class="admin-dashboard">
      <h1>控制台</h1>
      <p>歡迎，{{ user.name || user.login }}。請使用左側選單切換至「文章」，或從上方「快速新增」建立內容。點擊右上角頭像可編輯個人資料。</p>
      <div class="admin-quick-actions">
        <NuxtLink to="/admin/posts" class="admin-card">
          <span class="admin-card-title">文章</span>
          <span class="admin-card-desc">檢視與管理所有文章</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });
const { user, loading, login } = useAdminAuth();
</script>

<style scoped>
.admin-loading,
.admin-login,
.admin-dashboard {
  max-width: 32rem;
  margin: 0 auto;
}
.admin-loading {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}
.admin-login h1,
.admin-dashboard h1 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.admin-login p,
.admin-dashboard p {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}
.admin-btn-primary {
  background: var(--color-primary);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
}
.admin-btn-primary:hover {
  background: var(--color-primary-dark);
}
.admin-login-note {
  font-size: 0.8125rem;
  margin-top: 1rem;
  color: var(--color-text-tertiary);
}
.admin-quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}
.admin-card {
  display: block;
  padding: 1rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.admin-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
.admin-card-title {
  display: block;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.admin-card-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
</style>
