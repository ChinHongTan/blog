<template>
  <div class="admin-profile-page">
    <div v-if="loading" class="admin-profile-loading">載入中…</div>
    <div v-else-if="!profileMe" class="admin-profile-loading">無法載入個人資料，請重新登入。</div>
    <template v-else>
      <!-- Sticky header: banner + avatar + name (always visible) -->
      <div class="admin-profile-header">
        <div class="admin-profile-banner-wrap" @click="imagePickerMode = 'banner'; showImagePicker = true">
          <div class="admin-profile-banner" :class="{ empty: !form.banner }">
            <img v-if="form.banner" :src="form.banner" alt="" >
            <div v-else class="admin-profile-banner-placeholder" />
          </div>
          <div class="admin-profile-banner-overlay">
            <Icon name="heroicons:pencil-square" size="24" />
            <span>編輯</span>
          </div>
        </div>
        <div class="admin-profile-identity">
          <div class="admin-profile-avatar-wrap" @click="imagePickerMode = 'avatar'; showImagePicker = true">
            <img :src="form.avatar || profileMe?.avatar_url" :alt="form.name" class="admin-profile-avatar" >
            <div class="admin-profile-avatar-overlay">
              <Icon name="heroicons:pencil-square" size="20" />
              <span>編輯</span>
            </div>
          </div>
          <input
            v-model="form.name"
            type="text"
            class="admin-profile-name-input"
            placeholder="顯示名稱"
          >
        </div>
      </div>

      <!-- Tabs -->
      <div class="admin-profile-tabs">
        <button
          type="button"
          class="admin-profile-tab"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          <Icon name="heroicons:cog-6-tooth" size="18" />
          設定
        </button>
        <button
          type="button"
          class="admin-profile-tab"
          :class="{ active: activeTab === 'about' }"
          @click="activeTab = 'about'"
        >
          <Icon name="heroicons:document-text" size="18" />
          關於我
        </button>
      </div>

      <!-- Tab content: Settings -->
      <div v-show="activeTab === 'settings'" class="admin-profile-tab-content">
        <div class="admin-profile-form">
          <div class="admin-form-row">
            <label>電子郵件</label>
            <input v-model="form.email" type="email" class="admin-input" placeholder="email@example.com" >
          </div>
          <div class="admin-form-row">
            <label>簡短簡介</label>
            <input v-model="form.bio" type="text" class="admin-input" placeholder="一行簡介" >
          </div>
          <div class="admin-form-row">
            <label>社群連結</label>
            <div class="admin-social-list">
              <div class="admin-social-row">
                <Icon name="mdi:github" size="18" class="admin-social-icon" />
                <input v-model="form.social.github" type="url" class="admin-input" placeholder="https://github.com/..." >
              </div>
              <div class="admin-social-row">
                <Icon name="mdi:twitter" size="18" class="admin-social-icon" />
                <input v-model="form.social.twitter" type="url" class="admin-input" placeholder="https://x.com/..." >
              </div>
              <div class="admin-social-row">
                <Icon name="heroicons:link" size="18" class="admin-social-icon" />
                <input v-model="form.social.website" type="url" class="admin-input" placeholder="https://..." >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab content: About me (Milkdown) - v-show so content is preserved when switching tabs -->
      <div v-show="activeTab === 'about'" class="admin-profile-tab-content">
        <div class="admin-profile-editor-wrap">
          <ClientOnly>
            <AdminMilkdownEditor
              v-if="contentReady"
              ref="milkdownRef"
              :key="`profile-about-${profileMe?.login ?? 'me'}`"
              :default-value="form.body"
              @ready="onEditorReady"
            />
            <div v-else class="admin-profile-editor-loading">載入編輯器…</div>
          </ClientOnly>
        </div>
      </div>

      <div class="admin-profile-actions">
        <button type="button" class="admin-btn admin-btn-primary" :disabled="saving" @click="save">
          {{ saving ? "儲存中…" : "儲存" }}
        </button>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="showImagePicker" class="image-picker-overlay" @click.self="showImagePicker = false">
        <div class="image-picker-panel">
          <h3>選擇或上傳圖片</h3>
          <AdminImagePicker @select="onImageSelect" />
          <button type="button" class="admin-btn admin-btn-ghost mt-2" @click="showImagePicker = false">關閉</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

type ProfileMe = {
  login: string;
  name: string | null;
  avatar_url: string;
  authorPath: string | null;
  sha?: string;
  profile: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    social?: { github?: string; twitter?: string; website?: string };
    body?: string;
  } | null;
};

const profileMe = ref<ProfileMe | null>(null);
const loading = ref(true);
const saving = ref(false);
const contentReady = ref(false);
const showImagePicker = ref(false);
const imagePickerMode = ref<"banner" | "avatar">("banner");
const activeTab = ref<"settings" | "about">("settings");
const milkdownRef = ref<{ getMarkdown: () => string } | null>(null);
const getMarkdownRef = ref<(() => string) | null>(null);

const form = reactive({
  name: "",
  email: "",
  bio: "",
  avatar: "",
  banner: "",
  social: { github: "", twitter: "", website: "" },
  body: "",
});

function onEditorReady(api: { getMarkdown: () => string }) {
  getMarkdownRef.value = api.getMarkdown;
}

function getBodyContent(): string {
  return milkdownRef.value?.getMarkdown?.() ?? getMarkdownRef.value?.() ?? form.body;
}

function buildFrontmatter(): string {
  const lines: string[] = ["---"];
  if (form.name) lines.push(`name: ${form.name}`);
  if (form.email) lines.push(`email: ${form.email}`);
  if (form.bio) lines.push(`bio: "${(form.bio || "").replace(/"/g, '\\"')}"`);
  if (form.avatar) lines.push(`avatar: ${form.avatar}`);
  if (form.banner) lines.push(`banner: ${form.banner}`);
  if (form.social.github || form.social.twitter || form.social.website) {
    lines.push("social:");
    if (form.social.github) lines.push(`  github: ${form.social.github}`);
    lines.push(`  twitter: "${(form.social.twitter || "").replace(/"/g, '\\"')}"`);
    if (form.social.website) lines.push(`  website: ${form.social.website}`);
  }
  lines.push("---");
  return lines.join("\n");
}

async function load() {
  loading.value = true;
  try {
    const data = await $fetch<ProfileMe>("/api/admin/profile/me");
    profileMe.value = data;
    if (data?.profile) {
      form.name = data.profile.name ?? "";
      form.email = data.profile.email ?? "";
      form.bio = data.profile.bio ?? "";
      form.avatar = data.profile.avatar ?? "";
      form.banner = data.profile.banner ?? "";
      form.social.github = data.profile.social?.github ?? "";
      form.social.twitter = data.profile.social?.twitter ?? "";
      form.social.website = data.profile.social?.website ?? "";
      form.body = data.profile.body ?? "";
    } else {
      form.name = data?.name ?? data?.login ?? "";
      form.avatar = data?.avatar_url ?? "";
    }
  } catch {
    profileMe.value = null;
  } finally {
    loading.value = false;
    contentReady.value = true;
  }
}

async function save() {
  if (!profileMe.value?.authorPath) return;
  const content = `${buildFrontmatter()}\n\n${getBodyContent()}`;
  saving.value = true;
  try {
    await $fetch("/api/admin/repo/files", {
      method: "PUT",
      body: {
        path: profileMe.value.authorPath,
        content,
        sha: profileMe.value.sha,
        message: `更新個人資料：${profileMe.value.login}`,
      },
    });
    await load();
  } catch (e) {
    console.error(e);
    alert("儲存失敗，請查看主控台。");
  } finally {
    saving.value = false;
  }
}

function onImageSelect(path: string) {
  if (imagePickerMode.value === "banner") form.banner = path;
  else form.avatar = path;
  showImagePicker.value = false;
}

onMounted(load);
</script>

<style scoped>
.admin-profile-page {
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.admin-profile-loading {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-tertiary);
}

.admin-profile-header {
  position: relative;
  margin-bottom: 1.5rem;
}

.admin-profile-banner-wrap {
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.admin-profile-banner {
  width: 100%;
  height: 100%;
}

.admin-profile-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-profile-banner.empty .admin-profile-banner-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 25%, var(--color-bg-tertiary)) 0%,
    color-mix(in srgb, var(--color-accent) 15%, var(--color-bg-tertiary)) 100%
  );
}

.admin-profile-banner-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s;
}

.admin-profile-banner-wrap:hover .admin-profile-banner-overlay {
  opacity: 1;
}

.admin-profile-identity {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-top: -48px;
  padding-left: 1rem;
  position: relative;
  z-index: 1;
}

.admin-profile-avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--color-bg-primary);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  background: var(--color-bg-primary);
}

.admin-profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-profile-avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s;
}

.admin-profile-avatar-wrap:hover .admin-profile-avatar-overlay {
  opacity: 1;
}

.admin-profile-name-input {
  flex: 1;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}

.admin-profile-name-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 25%, transparent);
}

.admin-profile-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--color-border-light);
}

.admin-profile-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}

.admin-profile-tab:hover {
  color: var(--color-text-primary);
}

.admin-profile-tab.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-primary);
}

.admin-profile-tab-content {
  min-height: 280px;
}

.admin-profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-form-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.admin-form-row label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.admin-input {
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.admin-social-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.admin-social-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.admin-social-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.admin-social-row .admin-input {
  flex: 1;
}

.admin-profile-editor-wrap {
  min-height: 320px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-primary);
}

.admin-profile-editor-wrap :deep([data-milkdown-root]) {
  min-height: 300px;
  padding: 1rem;
}

.admin-profile-editor-loading {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.admin-profile-actions {
  margin-top: 1.5rem;
}

.admin-btn {
  padding: 0.5rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.admin-btn-primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.admin-btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.admin-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-btn-ghost {
  border-color: transparent;
  background: transparent;
}

.mt-2 {
  margin-top: 0.5rem;
}

.image-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-picker-panel {
  background: var(--color-bg-primary);
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 560px;
  width: 85vw;
  max-width: 900px;
  min-height: 420px;
  max-height: 85vh;
  overflow: auto;
  box-shadow: var(--shadow-lg);
}
</style>
