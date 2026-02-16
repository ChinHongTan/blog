<template>
  <div class="admin-list-page">
    <div class="admin-list-bar">
      <h2 class="admin-list-title">文章</h2>
      <NuxtLink to="/admin/editor?type=post" class="admin-list-add-btn">新增</NuxtLink>
    </div>

    <!-- 繼續撰寫：本機草稿 -->
    <section v-if="localDrafts.length > 0" class="admin-continue-writing">
      <h3 class="admin-continue-writing-title">繼續撰寫</h3>
      <div class="admin-draft-cards">
        <div v-for="d in localDrafts" :key="d.key" class="admin-draft-card">
          <NuxtLink :to="d.editorLink" class="admin-draft-card-link">
            <span class="admin-draft-card-badge" :class="{ 'admin-draft-card-badge-unsynced': d.isPublishedPath }">
              {{ d.isPublishedPath ? "本機有未同步變更" : "草稿" }}
            </span>
            <span class="admin-draft-card-title">{{ d.title }}</span>
            <p class="admin-draft-card-excerpt">{{ d.excerpt }}</p>
            <span class="admin-draft-card-time">{{ d.relativeTime }}</span>
          </NuxtLink>
          <button type="button" class="admin-draft-card-trash" aria-label="捨棄本機草稿" @click.prevent="openDiscardConfirm(d)">
            <Icon name="heroicons:trash" size="16" />
          </button>
        </div>
      </div>
    </section>

    <!-- 捨棄草稿確認 -->
    <Teleport to="body">
      <div v-if="discardConfirmDraft" class="admin-discard-confirm-overlay" @click.self="discardConfirmDraft = null">
        <div class="admin-discard-confirm-modal" @click.stop>
          <p class="admin-discard-confirm-text">確定要捨棄此本機草稿嗎？此操作無法復原。</p>
          <p v-if="discardConfirmDraft" class="admin-discard-confirm-title">{{ discardConfirmDraft.title }}</p>
          <div class="admin-discard-confirm-actions">
            <button type="button" class="admin-btn admin-btn-ghost" @click="discardConfirmDraft = null">取消</button>
            <button type="button" class="admin-btn admin-btn-primary admin-btn-danger" @click="confirmDiscardDraft">捨棄</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="loading" class="admin-list-loading">載入中…</div>
    <ul v-else class="admin-list">
      <li v-for="p in postList" :key="p.path" class="admin-list-item">
        <NuxtLink :to="`/admin/editor?type=post&path=${encodeURIComponent(p.path)}`" class="admin-list-link">
          {{ p.name }}
        </NuxtLink>
      </li>
      <li v-if="postList.length === 0 && localDrafts.length === 0" class="admin-list-empty">尚無文章</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const DRAFT_KEY_PREFIX = "admin-draft-post-";

interface LocalDraftItem {
  key: string;
  title: string;
  excerpt: string;
  relativeTime: string;
  editorLink: string;
  /** 本機草稿對應的是已發布文章（content/blog/），與下方文章列表同篇。 */
  isPublishedPath: boolean;
}

const postList = ref<{ name: string; path: string; stem: string }[]>([]);
const loading = ref(true);
const localDrafts = ref<LocalDraftItem[]>([]);
const discardConfirmDraft = ref<LocalDraftItem | null>(null);

function getRelativeTime(ms: number): string {
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60 * 1000) return "剛剛";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分鐘前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小時前`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)} 天前`;
  return new Date(ms).toLocaleDateString("zh-TW");
}

function loadLocalDrafts() {
  if (typeof localStorage === "undefined") {
    localDrafts.value = [];
    return;
  }
  const items: LocalDraftItem[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(DRAFT_KEY_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      const title = (data.meta?.title || "").trim() || "未命名文章";
      const body = (data.body || "").trim();
      const excerpt = body.split(/\n/).slice(0, 2).join(" ").trim().slice(0, 120) || "（尚無內容）";
      const savedAt = typeof data.savedAt === "number" ? data.savedAt : Date.now();
      const pathPart = key.slice(DRAFT_KEY_PREFIX.length);
      const editorLink = pathPart === "new" ? "/admin/editor?type=post" : `/admin/editor?type=post&path=${encodeURIComponent(pathPart)}`;
      const isPublishedPath = pathPart.startsWith("content/blog/");
      items.push({
        key,
        title,
        excerpt,
        relativeTime: `編輯於 ${getRelativeTime(savedAt)}`,
        editorLink,
        isPublishedPath,
      });
    } catch {
      /* skip invalid */
    }
  }
  items.sort((a, b) => {
    const rawA = localStorage.getItem(a.key);
    const rawB = localStorage.getItem(b.key);
    const savedAtA = rawA ? (() => { try { return JSON.parse(rawA).savedAt ?? 0; } catch { return 0; } })() : 0;
    const savedAtB = rawB ? (() => { try { return JSON.parse(rawB).savedAt ?? 0; } catch { return 0; } })() : 0;
    return savedAtB - savedAtA;
  });
  localDrafts.value = items;
}

function openDiscardConfirm(draft: LocalDraftItem) {
  discardConfirmDraft.value = draft;
}

function confirmDiscardDraft() {
  if (!discardConfirmDraft.value) return;
  const key = discardConfirmDraft.value.key;
  discardConfirmDraft.value = null;
  try {
    localStorage.removeItem(key);
    loadLocalDrafts();
  } catch {
    /* ignore */
  }
}

function discardLocalDraft(key: string) {
  try {
    localStorage.removeItem(key);
    loadLocalDrafts();
  } catch {
    /* ignore */
  }
}

async function load() {
  loading.value = true;
  try {
    postList.value = await $fetch<{ name: string; path: string; stem: string }[]>("/api/admin/repo/list?path=content/blog").catch(() => []);
    if (!Array.isArray(postList.value)) postList.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  loadLocalDrafts();
});

onActivated(loadLocalDrafts);
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

/* 繼續撰寫：本機草稿卡片 */
.admin-continue-writing {
  margin-bottom: 2rem;
}
.admin-continue-writing-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem;
}
.admin-draft-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.admin-draft-card {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-primary);
  border: 1px solid #eab308;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.admin-draft-card-link {
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  display: block;
}
.admin-draft-card-badge {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  background: color-mix(in srgb, #eab308 25%, transparent);
  color: #a16207;
  border-radius: 0.2rem;
  margin-bottom: 0.35rem;
}
.admin-draft-card-badge-unsynced {
  background: color-mix(in srgb, #2563eb 22%, transparent);
  color: #2563eb;
}
.admin-draft-card-title {
  display: block;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}
.admin-draft-card-excerpt {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.35rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.admin-draft-card-time {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}
.admin-draft-card-trash {
  flex-shrink: 0;
  padding: 0.35rem;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: 0.25rem;
  cursor: pointer;
}
.admin-draft-card-trash:hover {
  background: var(--color-bg-tertiary);
  color: #dc2626;
}

/* 捨棄草稿確認 */
.admin-discard-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.admin-discard-confirm-modal {
  background: var(--color-bg-primary);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  max-width: 28rem;
}
.admin-discard-confirm-text {
  margin: 0 0 0.5rem;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  line-height: 1.5;
}
.admin-discard-confirm-title {
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}
.admin-discard-confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
.admin-btn-danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}
.admin-btn-danger:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}
</style>
