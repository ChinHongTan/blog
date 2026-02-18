<template>
  <div class="admin-list-page">
    <div class="admin-list-bar">
      <h2 class="admin-list-title">文章</h2>
      <div class="admin-list-bar-actions">
        <button
          type="button"
          class="admin-filter-toggle"
          :class="{ active: filterMineOnly }"
          :aria-pressed="filterMineOnly"
          @click="filterMineOnly = !filterMineOnly"
        >
          只顯示我的文章
        </button>
        <NuxtLink to="/admin/editor?type=post" class="admin-list-add-btn">新增</NuxtLink>
      </div>
    </div>

    <!-- 繼續撰寫：本機草稿 -->
    <section v-if="localDrafts.length > 0" class="admin-continue-writing">
      <h3 class="admin-continue-writing-title">繼續撰寫</h3>
      <div class="admin-draft-cards">
        <div v-for="d in localDrafts" :key="d.key" class="admin-draft-card admin-draft-card-local">
          <NuxtLink :to="d.editorLink" class="admin-draft-card-link">
            <span class="admin-draft-card-badge admin-draft-card-badge-local" :class="{ 'admin-draft-card-badge-unsynced': d.isPublishedPath }">
              {{ d.isPublishedPath ? "本機有未同步變更" : "本機草稿" }}
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

    <!-- GitHub 草稿（僅顯示我的） -->
    <section v-if="githubDraftsMine.length > 0" class="admin-continue-writing">
      <h3 class="admin-continue-writing-title">GitHub 草稿</h3>
      <div class="admin-draft-cards">
        <div v-for="g in githubDraftsMine" :key="g.path" class="admin-draft-card admin-draft-card-github">
          <NuxtLink :to="g.editorLink" class="admin-draft-card-link">
            <span class="admin-draft-card-badge admin-draft-card-badge-github" :class="{ 'admin-draft-card-badge-has-local': hasLocalDraftForPath(g.path) }">
              {{ hasLocalDraftForPath(g.path) ? "本機亦有未同步版本" : "GitHub 草稿" }}
            </span>
            <span class="admin-draft-card-title">{{ g.title }}</span>
            <p class="admin-draft-card-excerpt">{{ g.authorDisplayName }}</p>
            <span class="admin-draft-card-time">{{ g.relativeDate }}</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 捨棄草稿確認：Alert Card -->
    <Teleport to="body">
      <div v-if="discardConfirmDraft" class="admin-discard-confirm-overlay" @click.self="discardConfirmDraft = null">
        <div class="admin-discard-confirm-modal" role="alertdialog" aria-labelledby="admin-discard-confirm-heading" aria-describedby="admin-discard-confirm-desc" @click.stop>
          <div class="admin-discard-confirm-icon" aria-hidden="true">
            <Icon name="heroicons:trash" size="28" />
          </div>
          <h3 id="admin-discard-confirm-heading" class="admin-discard-confirm-heading">捨棄未儲存的變更？</h3>
          <p id="admin-discard-confirm-desc" class="admin-discard-confirm-text">
            您確定要移除對這篇文章的本機修改嗎？此操作無法復原，您將回到伺服器上的版本。
          </p>
          <div v-if="discardConfirmDraft" class="admin-discard-confirm-object-card">
            <Icon name="heroicons:document-text" size="18" class="admin-discard-confirm-object-icon" aria-hidden="true" />
            <span class="admin-discard-confirm-object-title">{{ discardConfirmDraft.title }}</span>
          </div>
          <div class="admin-discard-confirm-actions">
            <button type="button" class="admin-btn admin-btn-ghost admin-discard-cancel" @click="discardConfirmDraft = null">取消</button>
            <button type="button" class="admin-btn admin-discard-submit" @click="confirmDiscardDraft">捨棄</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="loading" class="admin-list-loading">載入中…</div>
    <div v-else class="admin-posts-table-wrap">
      <table class="admin-posts-table" role="table">
        <thead>
          <tr>
            <th scope="col" class="admin-posts-th admin-posts-th-author">作者</th>
            <th scope="col" class="admin-posts-th admin-posts-th-title">標題</th>
            <th scope="col" class="admin-posts-th admin-posts-th-status">狀態</th>
            <th scope="col" class="admin-posts-th admin-posts-th-date">日期</th>
            <th scope="col" class="admin-posts-th admin-posts-th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredTableRows" :key="row.path || row.draftKey" class="admin-posts-tr">
            <td class="admin-posts-td admin-posts-td-author">
              <NuxtLink :to="row.editorLink" class="admin-posts-row-link">
                <span class="admin-posts-avatar-wrap" aria-hidden="true">
                  <img v-if="row.authorAvatar" :src="row.authorAvatar" alt="" class="admin-posts-avatar" width="32" height="32" />
                  <span v-else class="admin-posts-avatar admin-posts-avatar-fallback">{{ row.authorInitial }}</span>
                </span>
                <span class="admin-posts-author-name">{{ row.authorDisplayName || "—" }}</span>
              </NuxtLink>
            </td>
            <td class="admin-posts-td admin-posts-td-title">
              <NuxtLink :to="row.editorLink" class="admin-posts-title-link">
                {{ row.title }}
              </NuxtLink>
            </td>
            <td class="admin-posts-td admin-posts-td-status">
              <span class="admin-posts-badge" :class="row.statusClass">{{ row.statusLabel }}</span>
            </td>
            <td class="admin-posts-td admin-posts-td-date">
              <NuxtLink :to="row.editorLink" class="admin-posts-date-link">
                {{ row.relativeDate }}
              </NuxtLink>
            </td>
            <td class="admin-posts-td admin-posts-td-actions">
              <NuxtLink
                v-if="row.isMine"
                :to="row.editorLink"
                class="admin-posts-action-btn admin-posts-action-edit"
                title="編輯"
              >
                <Icon name="heroicons:pencil-square" size="18" />
                <span class="admin-posts-action-label">編輯</span>
              </NuxtLink>
              <NuxtLink
                v-else
                :to="row.editorLink"
                class="admin-posts-action-btn admin-posts-action-view"
                title="檢視（唯讀，無法上傳）"
              >
                <Icon name="heroicons:eye" size="18" />
                <span class="admin-posts-action-label">檢視</span>
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="filteredTableRows.length === 0 && localDrafts.length === 0 && githubDraftsMine.length === 0" class="admin-posts-empty">尚無文章</p>
      <p v-else-if="filterMineOnly && filteredTableRows.length === 0 && tableRows.length > 0" class="admin-posts-empty">沒有符合「只顯示我的文章」的文章</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const DRAFT_KEY_PREFIX = "admin-draft-post-";

interface PostIndexItem {
  title: string;
  author: string;
  authorDisplayName: string;
  authorAvatar: string;
  date: string;
  path: string;
  slug: string;
  draft: boolean;
}

interface LocalDraftItem {
  key: string;
  title: string;
  excerpt: string;
  relativeTime: string;
  editorLink: string;
  isPublishedPath: boolean;
  pathPart: string;
  savedAt: number;
}

interface GitHubDraftCardItem {
  path: string;
  title: string;
  authorDisplayName: string;
  authorAvatar: string;
  relativeDate: string;
  editorLink: string;
  dateMs: number;
}

type TableRow = {
  path: string;
  draftKey?: string;
  editorLink: string;
  viewLink: string;
  title: string;
  author: string;
  authorDisplayName: string;
  authorAvatar: string;
  authorInitial: string;
  statusLabel: string;
  statusClass: string;
  relativeDate: string;
  isMine: boolean;
  /** For sorting: newest first */
  dateMs: number;
};

const postIndex = ref<PostIndexItem[]>([]);
const loading = ref(true);
const localDrafts = ref<LocalDraftItem[]>([]);
const discardConfirmDraft = ref<LocalDraftItem | null>(null);
const currentUserAuthorId = ref<string | null>(null);
const filterMineOnly = ref(false);

function getRelativeTime(ms: number): string {
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60 * 1000) return "剛剛";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分鐘前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小時前`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)} 天前`;
  return new Date(ms).toLocaleDateString("zh-TW");
}

function getRelativeDate(isoDate: string): string {
  const ms = new Date(isoDate).getTime();
  if (Number.isNaN(ms)) return isoDate;
  return getRelativeTime(ms);
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
        pathPart,
        savedAt,
      });
    } catch {
      /* skip invalid */
    }
  }
  items.sort((a, b) => b.savedAt - a.savedAt);
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

function hasLocalDraftForPath(path: string): boolean {
  return localDrafts.value.some((d) => d.pathPart === path);
}

function isLocalOnlyDraftPath(pathPart: string): boolean {
  return pathPart === "new" || pathPart.startsWith("content/drafts/");
}

/** GitHub 上的草稿且作者為當前登入用戶，用於頂部卡片。 */
const githubDraftsMine = computed<GitHubDraftCardItem[]>(() => {
  const index = postIndex.value;
  const authorId = currentUserAuthorId.value;
  if (!authorId) return [];
  return index
    .filter((p) => p.draft && p.author.toLowerCase() === authorId.toLowerCase())
    .map((p) => {
      const dateMs = new Date(p.date).getTime();
      return {
        path: p.path,
        title: p.title,
        authorDisplayName: p.authorDisplayName || p.author || "—",
        authorAvatar: p.authorAvatar || "",
        relativeDate: getRelativeDate(p.date),
        editorLink: `/admin/editor?type=post&path=${encodeURIComponent(p.path)}`,
        dateMs: Number.isNaN(dateMs) ? 0 : dateMs,
      };
    })
    .sort((a, b) => b.dateMs - a.dateMs);
});

const tableRows = computed<TableRow[]>(() => {
  const drafts = localDrafts.value;
  const index = postIndex.value;
  const authorId = currentUserAuthorId.value;
  const rows: TableRow[] = [];

  for (const p of index) {
    const hasLocal = hasLocalDraftForPath(p.path);
    const statusLabel = hasLocal ? "本機草稿" : p.draft ? "GitHub 草稿" : "已發布";
    const statusClass = hasLocal ? "admin-posts-badge-local" : p.draft ? "admin-posts-badge-draft" : "admin-posts-badge-published";
    const isMine = !!authorId && p.author.toLowerCase() === authorId.toLowerCase();
    const dateMs = new Date(p.date).getTime();
    rows.push({
      path: p.path,
      editorLink: `/admin/editor?type=post&path=${encodeURIComponent(p.path)}`,
      viewLink: p.slug || "",
      title: p.title,
      author: p.author,
      authorDisplayName: p.authorDisplayName || p.author || "—",
      authorAvatar: p.authorAvatar || "",
      authorInitial: (p.authorDisplayName || p.author || "?")[0]?.toUpperCase() ?? "?",
      statusLabel,
      statusClass,
      relativeDate: getRelativeDate(p.date),
      isMine,
      dateMs: Number.isNaN(dateMs) ? 0 : dateMs,
    });
  }

  const indexPaths = new Set(index.map((p) => p.path));
  for (const d of drafts) {
    if (!isLocalOnlyDraftPath(d.pathPart)) continue;
    if (indexPaths.has(d.pathPart)) continue;
    rows.push({
      path: "",
      draftKey: d.key,
      editorLink: d.editorLink,
      viewLink: "",
      title: d.title,
      author: "",
      authorDisplayName: "—",
      authorAvatar: "",
      authorInitial: "?",
      statusLabel: "本機草稿",
      statusClass: "admin-posts-badge-local",
      relativeDate: getRelativeTime(d.savedAt),
      isMine: true,
      dateMs: d.savedAt,
    });
  }

  // Sort by date (newest first)
  rows.sort((a, b) => b.dateMs - a.dateMs);
  return rows;
});

const filteredTableRows = computed<TableRow[]>(() => {
  if (!filterMineOnly.value) return tableRows.value;
  return tableRows.value.filter((r) => r.isMine);
});

async function load() {
  loading.value = true;
  try {
    postIndex.value = await $fetch<PostIndexItem[]>("/api/admin/posts-index").catch(() => []);
    if (!Array.isArray(postIndex.value)) postIndex.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  load();
  loadLocalDrafts();
  try {
    const profile = await $fetch<{ authorId?: string | null }>("/api/admin/profile/me").catch(() => null);
    currentUserAuthorId.value = profile?.authorId ?? null;
  } catch {
    currentUserAuthorId.value = null;
  }
});

onActivated(() => {
  load();
  loadLocalDrafts();
});
</script>

<style scoped>
.admin-list-page {
  max-width: 1000px;
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
.admin-list-bar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.admin-filter-toggle {
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.admin-filter-toggle:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-tertiary);
}
.admin-filter-toggle.active {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
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

/* Table (frameless: no card border/background) */
.admin-posts-table-wrap {
  margin: 0;
  padding: 0;
}
.admin-posts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}
.admin-posts-th {
  text-align: left;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border-light);
  white-space: nowrap;
}
.admin-posts-th-author {
  width: 1%;
}
.admin-posts-th-status {
  width: 1%;
}
.admin-posts-th-date {
  width: 1%;
}
.admin-posts-th-actions {
  width: 1%;
  text-align: right;
}
.admin-posts-tr {
  border-bottom: 1px solid var(--color-border-light);
  transition: background 0.15s ease;
}
.admin-posts-tr:last-child {
  border-bottom: none;
}
.admin-posts-tr:hover {
  background: color-mix(in srgb, var(--color-primary) 0.08, var(--color-bg-primary));
}
.admin-posts-td {
  padding: 0.65rem 1rem;
  vertical-align: middle;
}
.admin-posts-row-link,
.admin-posts-title-link,
.admin-posts-date-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-primary);
  text-decoration: none;
}
.admin-posts-row-link:hover,
.admin-posts-title-link:hover,
.admin-posts-date-link:hover {
  color: var(--color-primary);
}
.admin-posts-title-link {
  font-weight: 500;
  min-width: 0;
}
.admin-posts-title-link:hover {
  text-decoration: underline;
}
.admin-posts-date-link {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
.admin-posts-date-link:hover {
  color: var(--color-primary);
}
.admin-posts-avatar-wrap {
  flex-shrink: 0;
}
.admin-posts-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
.admin-posts-avatar-fallback {
  background: color-mix(in srgb, var(--color-primary) 25%, transparent);
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.admin-posts-author-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.admin-posts-td-actions {
  text-align: right;
  white-space: nowrap;
}
.admin-posts-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.admin-posts-action-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}
.admin-posts-action-edit {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
}
.admin-posts-action-edit:hover {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
}
.admin-posts-action-label {
  font-weight: 500;
}
.admin-posts-badge {
  display: inline-block;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}
.admin-posts-badge-local {
  background: color-mix(in srgb, #eab308 28%, transparent);
  color: #a16207;
}
.admin-posts-badge-draft {
  background: color-mix(in srgb, #64748b 24%, transparent);
  color: #475569;
}
.admin-posts-badge-published {
  background: color-mix(in srgb, #2563eb 22%, transparent);
  color: #2563eb;
}
.admin-posts-empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 0.9375rem;
  margin: 0;
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
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.admin-draft-card-local {
  border: 1px solid #eab308;
}
.admin-draft-card-github {
  border: 1px solid #64748b;
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
  border-radius: 0.2rem;
  margin-bottom: 0.35rem;
}
.admin-draft-card-badge-local {
  background: color-mix(in srgb, #eab308 25%, transparent);
  color: #a16207;
}
.admin-draft-card-badge-github {
  background: color-mix(in srgb, #64748b 24%, transparent);
  color: #475569;
}
.admin-draft-card-badge-unsynced {
  background: color-mix(in srgb, #2563eb 22%, transparent);
  color: #2563eb;
}
.admin-draft-card-badge-has-local {
  background: color-mix(in srgb, #eab308 22%, transparent);
  color: #a16207;
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

/* 捨棄草稿確認 — Alert Card */
.admin-discard-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.admin-discard-confirm-modal {
  background: var(--color-bg-primary);
  padding: 1.75rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0, 0, 0, 0.05);
  max-width: 26rem;
  text-align: center;
}
.admin-discard-confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}
.admin-discard-confirm-heading {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.01em;
}
.admin-discard-confirm-text {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.55;
  text-align: center;
}
.admin-discard-confirm-object-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-tertiary);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
  text-align: left;
}
.admin-discard-confirm-object-icon {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}
.admin-discard-confirm-object-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-discard-confirm-actions {
  display: flex;
  gap: 1.25rem;
  justify-content: stretch;
}
.admin-discard-confirm-actions .admin-btn {
  flex: 1;
  min-width: 0;
  justify-content: center;
}
.admin-discard-cancel {
  background: transparent !important;
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.2));
  color: var(--color-text-primary);
}
.admin-discard-cancel:hover {
  background: var(--color-bg-tertiary) !important;
  border-color: var(--color-text-tertiary);
  color: var(--color-text-primary);
}
.admin-discard-submit {
  background: #ef4444;
  border: 1px solid #ef4444;
  color: #fff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
}
.admin-discard-submit:hover {
  background: #dc2626;
  border-color: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}
</style>
