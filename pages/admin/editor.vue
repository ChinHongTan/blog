<template>
  <div class="admin-editor-page">
    <!-- Badge and 發布 in top nav. Badge: 已儲存變更 (saved) / 未儲存變更 (unsaved) / 草稿. Button: 已發布 (disabled when saved) or 發布. -->
    <Teleport to="#admin-editor-nav-actions">
      <span class="admin-status-badge" :class="editorStatusClass">{{ editorStatusLabel }}</span>
      <button type="button" class="admin-btn admin-btn-primary" :disabled="saving || !canEditPost || (isPublishedPost && !hasUnsavedChanges)" :title="canEditPost ? '' : '您只能編輯自己的文章'" @click="publish">
        {{ saving ? "儲存中…" : isPublishedPost && !hasUnsavedChanges ? "已發布" : "發布" }}
      </button>
    </Teleport>

    <div v-if="docType === 'post' && !canEditPost && pathQuery" class="admin-editor-readonly-hint">
      此文章作者 ID 為「{{ meta.author }}」，您只能檢視；儲存按鈕已停用。
    </div>
    <div class="admin-editor-body">
      <!-- Post: toolbar, then metadata (same width as editor), then editor -->
      <template v-if="docType === 'post'">
        <!-- 編輯/原始碼 toolbar -->
        <div class="admin-editor-toolbar">
          <div class="admin-editor-tabs">
            <button type="button" class="admin-tab" :class="{ active: viewMode === 'wysiwyg' }" @click="viewMode = 'wysiwyg'">編輯</button>
            <button type="button" class="admin-tab" :class="{ active: viewMode === 'raw' }" @click="viewMode = 'raw'">原始碼</button>
          </div>
        </div>

        <!-- Metadata: below toolbar, same width as editor -->
        <div class="admin-properties-top">
          <button type="button" class="admin-properties-toggle" :aria-expanded="propertiesOpen" @click="propertiesOpen = !propertiesOpen">
            <Icon :name="propertiesOpen ? 'heroicons:chevron-down' : 'heroicons:chevron-right'" size="18" />
            <span>屬性</span>
          </button>
          <Transition name="properties-panel">
            <div v-show="propertiesOpen" class="admin-properties-table-wrap">
          <div class="admin-properties-table">
            <div class="admin-property-tr">
              <span class="admin-property-name">標題</span>
              <input v-model="meta.title" type="text" class="admin-property-cell" placeholder="未命名" >
            </div>
            <div class="admin-property-tr">
              <span class="admin-property-name">簡述</span>
              <input v-model="meta.description" type="text" class="admin-property-cell" placeholder="空" >
            </div>
            <div class="admin-property-tr admin-property-tr-tags">
              <span class="admin-property-name">標籤</span>
              <div
                class="admin-property-cell admin-property-tags-wrap"
                @click="focusTagInput"
              >
                <template v-for="t in meta.tags" :key="t">
                  <span class="admin-meta-chip">
                    {{ t }}
                    <button type="button" class="admin-meta-chip-remove" aria-label="移除" @click.stop="removeTag(t)">×</button>
                  </span>
                </template>
                <input
                  ref="tagInputRef"
                  type="text"
                  class="admin-property-tag-input"
                  placeholder="空"
                  @keydown.enter.prevent="addTag"
                >
              </div>
            </div>
            <div class="admin-property-tr admin-property-tr-tags">
              <span class="admin-property-name">系列</span>
              <div
                class="admin-property-cell admin-property-tags-wrap"
                @click="focusSeriesInput"
              >
                <template v-for="s in meta.series" :key="'s-' + s">
                  <span class="admin-meta-chip admin-meta-chip-series">
                    {{ s }}
                    <button type="button" class="admin-meta-chip-remove" aria-label="移除" @click.stop="removeSeries(s)">×</button>
                  </span>
                </template>
                <input
                  ref="seriesInputRef"
                  type="text"
                  class="admin-property-tag-input"
                  placeholder="空"
                  @keydown.enter.prevent="addSeries"
                >
              </div>
            </div>
          </div>
            </div>
          </Transition>
        </div>

        <!-- Hero image: below table, above editor. Empty slot or blog-style hero with glass title. Click to choose/change. -->
        <div
          class="admin-hero-slot"
          :class="{ empty: !meta.featured_image }"
          role="button"
          tabindex="0"
          @click="imagePickerMode = 'featured'; showImagePicker = true"
          @keydown.enter="imagePickerMode = 'featured'; showImagePicker = true"
          @keydown.space.prevent="imagePickerMode = 'featured'; showImagePicker = true"
        >
          <template v-if="meta.featured_image">
            <img :src="meta.featured_image" :alt="meta.title || '精選圖片'" >
            <div class="admin-hero-title-wrap">
              <h2 class="admin-hero-title">{{ meta.title || "未命名" }}</h2>
            </div>
          </template>
          <span v-else class="admin-hero-empty-label">點擊選擇精選圖片</span>
        </div>

        <!-- Editor full width -->
        <div class="admin-editor-main">
          <div class="admin-wysiwyg-site">
            <div v-show="viewMode === 'wysiwyg'" class="admin-editor-wysiwyg">
              <ClientOnly>
                <AdminMilkdownEditor
                  v-if="contentReady"
                  :key="`editor-${pathQuery || slug || 'new'}`"
                  ref="milkdownRef"
                  :default-value="body"
                  @ready="onEditorReady"
                />
                <div v-else class="admin-editor-loading">載入內容…</div>
              </ClientOnly>
            </div>
            <div v-show="viewMode === 'raw'" class="admin-editor-raw">
              <textarea v-model="rawBody" class="admin-textarea" spellcheck="false" placeholder="Markdown 內容…" />
            </div>
          </div>
        </div>
      </template>

      <!-- Author: toolbar + meta + editor -->
      <template v-else-if="docType === 'author'">
        <div class="admin-editor-toolbar">
          <div class="admin-editor-tabs">
            <button type="button" class="admin-tab" :class="{ active: viewMode === 'wysiwyg' }" @click="viewMode = 'wysiwyg'">編輯</button>
            <button type="button" class="admin-tab" :class="{ active: viewMode === 'raw' }" @click="viewMode = 'raw'">原始碼</button>
          </div>
        </div>
        <div class="admin-editor-meta-wrap">
        <div class="admin-editor-meta">
          <div class="admin-form-row">
            <label>名稱</label>
            <input v-model="meta.name" type="text" class="admin-input" placeholder="顯示名稱" >
          </div>
          <div class="admin-form-row">
            <label>電子郵件</label>
            <input v-model="meta.email" type="email" class="admin-input" placeholder="email@example.com" >
          </div>
          <div class="admin-form-row">
            <label>簡介</label>
            <input v-model="meta.bio" type="text" class="admin-input" placeholder="一行簡介" >
          </div>
          <div class="admin-form-row">
            <label>頭像網址</label>
            <div class="admin-input-group">
              <input v-model="meta.avatar" type="text" class="admin-input" placeholder="/images/avatar.png" >
              <button type="button" class="admin-btn admin-btn-sm" @click="imagePickerMode = 'avatar'; showImagePicker = true">選擇</button>
            </div>
          </div>
          <div class="admin-form-row">
            <label>橫幅網址</label>
            <input v-model="meta.banner" type="text" class="admin-input" placeholder="/images/banner.jpg" >
          </div>
          <div class="admin-form-row">
            <label>GitHub</label>
            <input v-model="meta.github" type="url" class="admin-input" placeholder="https://github.com/..." >
          </div>
          <div class="admin-form-row">
            <label>網站</label>
            <input v-model="meta.website" type="url" class="admin-input" placeholder="https://..." >
          </div>
        </div>
        <div class="admin-wysiwyg-site admin-editor-main">
          <div v-show="viewMode === 'wysiwyg'" class="admin-editor-wysiwyg">
            <ClientOnly>
              <AdminMilkdownEditor
                v-if="contentReady"
                :key="`editor-${pathQuery || slug || 'new'}`"
                ref="milkdownRef"
                :default-value="body"
                @ready="onEditorReady"
              />
              <div v-else class="admin-editor-loading">載入內容…</div>
            </ClientOnly>
          </div>
          <div v-show="viewMode === 'raw'" class="admin-editor-raw">
            <textarea v-model="rawBody" class="admin-textarea" spellcheck="false" placeholder="Markdown 內容…" />
          </div>
        </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="showImagePicker" class="image-picker-overlay" @click.self="showImagePicker = false">
        <div class="image-picker-panel">
          <h3>選擇或上傳圖片</h3>
          <AdminImagePicker
            @select="onImageSelect"
          />
          <button type="button" class="admin-btn admin-btn-ghost mt-2" @click="showImagePicker = false">關閉</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });

const route = useRoute();
useAdminAuth();
const docType = computed(() => (route.query.type as string) || "post");
const slug = computed(() => (route.query.slug as string) || "");
const pathQuery = computed(() => (route.query.path as string) || "");

/** Current user's immutable author ID (filename stem from profile/me). Used to allow save only for own posts. */
const currentUserAuthorId = ref<string | null>(null);
const canEditPost = computed(() => {
  if (docType.value !== "post") return true;
  if (!pathQuery.value) return true; // new post
  if (!currentUserAuthorId.value) return false; // not loaded yet
  const postAuthor = (meta.author ?? "").trim().toLowerCase();
  const me = (currentUserAuthorId.value ?? "").trim().toLowerCase();
  return postAuthor === me;
});

function slugifyTitle(title: string): string {
  const s = (title || "").trim().replace(/\s+/g, "-").replace(/[/\\?*:|<>"]/g, "");
  return s || "untitled";
}

const meta = reactive({
  title: "",
  description: "",
  date: "",
  author: "",
  path: "",
  series: [] as string[],
  tags: [] as string[],
  featured_image: "",
  name: "",
  email: "",
  bio: "",
  avatar: "",
  banner: "",
  github: "",
  website: "",
});
const body = ref("");
const rawBody = ref("");
const viewMode = ref<"wysiwyg" | "raw">("wysiwyg");
const milkdownRef = ref<{ getMarkdown: () => string } | null>(null);
const getMarkdownRef = ref<(() => string) | null>(null);
const authors = ref<{ name: string; path: string; displayName?: string }[]>([]);
const saving = ref(false);
const showImagePicker = ref(false);
type ImagePickerMode = "content" | "avatar" | "featured";
const imagePickerMode = ref<ImagePickerMode>("content");
const propertiesOpen = ref(true);
const tagInputRef = ref<HTMLInputElement | null>(null);
const seriesInputRef = ref<HTMLInputElement | null>(null);
const fileSha = ref<string | undefined>(undefined);
/** True after initial content load (or no file to load). Ensures Milkdown mounts with correct body. */
const contentReady = ref(false);

function focusTagInput() {
  tagInputRef.value?.focus();
}
function focusSeriesInput() {
  seriesInputRef.value?.focus();
}
function addTag() {
  const el = tagInputRef.value;
  const v = (el?.value ?? "").trim();
  if (v && !meta.tags.includes(v)) {
    meta.tags.push(v);
    if (el) el.value = "";
  }
}
function removeTag(t: string) {
  meta.tags = meta.tags.filter((x) => x !== t);
}
function addSeries() {
  const el = seriesInputRef.value;
  const v = (el?.value ?? "").trim();
  if (v && !meta.series.includes(v)) {
    meta.series.push(v);
    if (el) el.value = "";
  }
}
function removeSeries(s: string) {
  meta.series = meta.series.filter((x) => x !== s);
}
function syncTitleFromFirstH1() {
  const md = getBodyContent();
  const m = md.match(/^#\s+(.+)$/m);
  if (m) meta.title = m[1].trim();
}

const _previewSource = computed(() =>
  viewMode.value === "raw" ? rawBody.value : (milkdownRef.value?.getMarkdown?.() ?? getMarkdownRef.value?.() ?? rawBody.value)
);

const filePath = computed(() => {
  if (pathQuery.value) return pathQuery.value;
  if (docType.value === "post") return slug.value ? `content/blog/${slug.value}.md` : "";
  if (docType.value === "author") return slug.value ? `content/authors/${slug.value}.md` : "";
  return "";
});

const draftKey = computed(() => `admin-draft-${docType.value}-${pathQuery.value || slug.value || "new"}`);

/** Last saved meta/body for dirty check. Meta is reactive; body needs polling (Milkdown has no change event). */
const lastSavedMetaJson = ref<string | null>(null);
const lastSavedBody = ref<string | null>(null);
/** Cached serialized meta, updated only when meta changes (trigger-based). */
const cachedMetaJson = ref("");
/** Bump every 2s to re-check body from Milkdown (no editor change event). */
const bodyCheckTrigger = ref(0);
let bodyCheckInterval: ReturnType<typeof setInterval> | null = null;

const isPublishedPost = computed(() => docType.value === "post" && !!pathQuery.value && !!fileSha.value);

function serializeMeta(): string {
  const metaCopy = { ...meta, tags: [...meta.tags], series: [...meta.series] };
  return JSON.stringify(metaCopy);
}

function normalizeBodyForCompare(s: string): string {
  return (s || "").replace(/\r\n/g, "\n").trim();
}

const hasUnsavedChanges = computed(() => {
  void bodyCheckTrigger.value; // poll body every 2s
  if (lastSavedMetaJson.value === null) return true; // new doc
  const bodyNow = normalizeBodyForCompare(getBodyContent());
  const bodySaved = normalizeBodyForCompare(lastSavedBody.value ?? "");
  return cachedMetaJson.value !== lastSavedMetaJson.value || bodyNow !== bodySaved;
});

/** Badge: saved (green) / unsaved (red) / draft (grey). */
const editorStatusClass = computed(() => {
  if (docType.value !== "post") return "draft";
  if (!isPublishedPost.value) return "draft";
  return hasUnsavedChanges.value ? "unsaved" : "saved";
});
const editorStatusLabel = computed(() => {
  if (docType.value !== "post") return "草稿";
  if (!isPublishedPost.value) return "草稿";
  return hasUnsavedChanges.value ? "未儲存變更" : "已儲存變更";
});

function onEditorReady(api: { getMarkdown: () => string }) {
  getMarkdownRef.value = api.getMarkdown;
}

function buildFrontmatter(): string {
  const lines: string[] = ["---"];
  if (docType.value === "post") {
    if (meta.title) lines.push(`title: ${meta.title}`);
    if (meta.description) lines.push(`description: ${meta.description}`);
    if (meta.date) lines.push(`date: ${meta.date}`);
    if (meta.author) lines.push(`author: ${meta.author}`);
    if (meta.path) lines.push(`path: ${meta.path}`);
    if (meta.featured_image) lines.push(`featured_image: ${meta.featured_image}`);
    if (meta.series.length) lines.push(`series:\n  - ${meta.series.join("\n  - ")}`);
    if (meta.tags.length) lines.push(`tags:\n  - ${meta.tags.join("\n  - ")}`);
  } else if (docType.value === "author") {
    if (meta.name) lines.push(`name: ${meta.name}`);
    if (meta.email) lines.push(`email: ${meta.email}`);
    if (meta.bio) lines.push(`bio: "${(meta.bio || "").replace(/"/g, '\\"')}"`);
    if (meta.avatar) lines.push(`avatar: ${meta.avatar}`);
    if (meta.banner) lines.push(`banner: ${meta.banner}`);
    if (meta.github || meta.website) {
      lines.push("social:");
      if (meta.github) lines.push(`  github: ${meta.github}`);
      lines.push("  twitter: \"\"");
      if (meta.website) lines.push(`  website: ${meta.website}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function getBodyContent(): string {
  if (viewMode.value === "raw") return rawBody.value;
  return milkdownRef.value?.getMarkdown?.() ?? getMarkdownRef.value?.() ?? rawBody.value;
}

function saveDraft() {
  const content = getBodyContent();
  const data = { meta: { ...meta }, body: content };
  try {
    localStorage.setItem(draftKey.value, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

function captureLastSavedSnapshot() {
  lastSavedMetaJson.value = serializeMeta();
  lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(draftKey.value);
    if (!raw) return;
    const data = JSON.parse(raw);
    const m = data.meta || {};
    Object.keys(meta).forEach((k) => {
      if (k === "tags" || k === "series") {
        if (Array.isArray(m[k])) (meta as Record<string, unknown>)[k] = m[k];
        else if (typeof m.tagsText === "string") (meta as Record<string, unknown>).tags = m.tagsText.split(",").map((s: string) => s.trim()).filter(Boolean);
        else if (typeof m.seriesText === "string") (meta as Record<string, unknown>).series = m.seriesText.split(",").map((s: string) => s.trim()).filter(Boolean);
      } else if (m[k] !== undefined) (meta as Record<string, unknown>)[k] = m[k];
    });
    body.value = data.body ?? "";
    rawBody.value = data.body ?? "";
  } catch {
    // ignore
  }
}

function loadFromApi() {
  if (!filePath.value) {
    if (docType.value === "post") {
      meta.date = new Date().toISOString().slice(0, 16);
    }
    loadDraft();
    nextTick(() => {
      cachedMetaJson.value = serializeMeta();
    });
    contentReady.value = true;
    return;
  }
  $fetch<{ content: string; sha?: string }>(`/api/admin/repo/files?path=${encodeURIComponent(filePath.value)}`)
    .then((res) => {
      fileSha.value = res.sha;
      const raw = res.content || "";
      const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
      if (match) {
        const front = match[1];
        body.value = match[2].trim();
        rawBody.value = match[2].trim();
        front.split("\n").forEach((line) => {
          const m = line.match(/^(\w+):\s*(.*)$/);
          if (m) {
            const key = m[1];
            const val = m[2].trim().replace(/^["']|["']$/g, "");
            if (key === "series" || key === "tags" || key === "social") return;
            (meta as Record<string, string>)[key] = val;
          }
        });
        if (docType.value === "post" && raw.includes("series:")) {
          const seriesMatch = raw.match(/series:\s*\n((?:\s+-\s*.+\n?)+)/);
          if (seriesMatch) {
            meta.series = seriesMatch[1]
              .replace(/^\s*-\s*/gm, "")
              .trim()
              .split(/\n\s*-\s*/)
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }
        if (docType.value === "post" && raw.includes("tags:")) {
          const tagsMatch = raw.match(/tags:\s*\n((?:\s+-\s*.+\n?)+)/);
          if (tagsMatch) {
            meta.tags = tagsMatch[1]
              .replace(/^\s*-\s*/gm, "")
              .trim()
              .split(/\n\s*-\s*/)
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }
        if (docType.value === "post" && raw.includes("featured_image:")) {
          const fi = raw.match(/featured_image:\s*(.+)/m);
          if (fi) meta.featured_image = fi[1].trim();
        }
        if (docType.value === "author" && raw.includes("social:")) {
          const gh = raw.match(/github:\s*(.+)/m);
          const web = raw.match(/website:\s*(.+)/m);
          if (gh) meta.github = gh[1].trim();
          if (web) meta.website = web[1].trim();
        }
      } else {
        body.value = raw;
        rawBody.value = raw;
      }
      nextTick(() => {
        cachedMetaJson.value = serializeMeta();
        lastSavedMetaJson.value = cachedMetaJson.value;
        lastSavedBody.value = normalizeBodyForCompare(rawBody.value);
        const serverAuthor = meta.author;
        const hasDraft = typeof localStorage !== "undefined" && localStorage.getItem(draftKey.value);
        if (hasDraft) {
          loadDraft();
          if (docType.value === "post" && serverAuthor !== undefined) meta.author = serverAuthor;
        }
        setTimeout(() => {
          lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
        }, 600);
      });
      contentReady.value = true;
    })
    .catch(() => {
      loadDraft();
      if (docType.value === "post") meta.date = new Date().toISOString().slice(0, 16);
      contentReady.value = true;
    });
}

async function publish() {
  if (docType.value === "post") {
    if (!meta.title) syncTitleFromFirstH1();
    meta.date = new Date().toISOString();
    meta.author = currentUserAuthorId.value ?? meta.author;
    if (!pathQuery.value) {
      meta.path = `/blog/${slugifyTitle(meta.title)}`;
    }
  }
  const content = `${buildFrontmatter()}\n\n${getBodyContent()}`;
  let path = filePath.value;
  if (!path) {
    if (docType.value === "post") {
      const stem = meta.path?.replace(/^\/blog\/?/, "").trim() || slugifyTitle(meta.title);
      path = `content/blog/${stem}.md`;
    } else {
      path = `content/authors/${slug.value || meta.name || "new-author"}.md`;
    }
  }
  saving.value = true;
  try {
    const res = await $fetch<{ sha?: string }>("/api/admin/repo/files", {
      method: "PUT",
      body: { path, content, sha: fileSha.value, message: `Update ${path}` },
    });
    fileSha.value = res?.sha ?? fileSha.value;
    try {
      localStorage.removeItem(draftKey.value);
    } catch {
      /* ignore */
    }
    captureLastSavedSnapshot();
    if (slug.value) loadFromApi();
  } catch (e) {
    console.error(e);
    alert("儲存失敗，請查看主控台。");
  } finally {
    saving.value = false;
  }
}

function onImageSelect(path: string) {
  if (imagePickerMode.value === "featured") {
    meta.featured_image = path;
  } else if (docType.value === "author" || imagePickerMode.value === "avatar") {
    meta.avatar = path;
  } else {
    const insert = `\n![image](${path})\n`;
    rawBody.value += insert;
    if (viewMode.value === "wysiwyg") body.value = rawBody.value;
  }
  showImagePicker.value = false;
}

watch(
  meta,
  () => {
    cachedMetaJson.value = serializeMeta();
  },
  { deep: true }
);


onMounted(async () => {
  $fetch<{ name: string; path: string; displayName?: string }[]>("/api/admin/repo/authors")
    .then((list) => (authors.value = list))
    .catch(() => (authors.value = []));
  try {
    const profile = await $fetch<{ authorId?: string | null }>("/api/admin/profile/me");
    currentUserAuthorId.value = profile?.authorId ?? null;
  } catch {
    currentUserAuthorId.value = null;
  }
  loadFromApi();
  bodyCheckInterval = setInterval(() => {
    bodyCheckTrigger.value++;
  }, 2000);
  setInterval(() => {
    if (docType.value === "post" || docType.value === "author") saveDraft();
  }, 30000);
  // Auto-save is timer-based (30s) rather than on every change: fewer localStorage writes and less CPU.
});

onUnmounted(() => {
  if (bodyCheckInterval) clearInterval(bodyCheckInterval);
});
</script>

<style scoped>
.admin-editor-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  min-height: 0;
}

.admin-editor-readonly-hint {
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Editor body: single column, properties at top */
.admin-editor-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: visible;
  width: 100%;
}
.admin-editor-body .admin-editor-main {
  flex: 1;
  min-width: 0;
  overflow: visible;
  min-height: 60vh;
}

/* Toolbar (inline, below properties) */
.admin-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}
.admin-editor-toolbar .admin-editor-tabs {
  display: flex;
  gap: 0.25rem;
}
.admin-editor-toolbar .admin-editor-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.admin-status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
}
.admin-status-badge.draft {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
.admin-status-badge.saved {
  background: color-mix(in srgb, var(--color-primary) 22%, transparent);
  color: var(--color-primary-dark);
}
.admin-status-badge.unsaved {
  background: color-mix(in srgb, #dc2626 18%, transparent);
  color: #dc2626;
}

/* Obsidian-style borderless properties table at top */
.admin-properties-top {
  margin-bottom: 0.5rem;
  padding-left: 120px;
}
.admin-properties-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  background: none;
  border: none;
  cursor: pointer;
  user-select: none;
}
.admin-properties-toggle:hover {
  color: var(--color-primary);
}
.admin-properties-table-wrap {
  overflow: hidden;
}
.admin-properties-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 0.25rem;
  font-size: 0.8125rem;
}
/* Animate 屬性 panel open/close */
.properties-panel-enter-active,
.properties-panel-leave-active {
  transition: max-height 0.25s ease-out, opacity 0.2s ease-out;
}
.properties-panel-enter-from,
.properties-panel-leave-to {
  max-height: 0;
  opacity: 0;
}
.properties-panel-enter-to,
.properties-panel-leave-from {
  max-height: 500px;
  opacity: 1;
}
.admin-property-tr {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0;
  min-height: 2rem;
  border: none;
}
.admin-property-name {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.admin-property-cell {
  min-width: 0;
  padding: 0.2rem 0.35rem;
  font-size: 0.8125rem;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  border-radius: 0.2rem;
}
.admin-property-cell:focus {
  outline: 1px solid var(--color-primary);
  outline-offset: 1px;
}
.admin-property-cell-flex {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}
.admin-property-empty {
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
}
.admin-property-thumb {
  width: 40px;
  height: 40px;
  border-radius: 0.25rem;
  overflow: hidden;
  background: var(--color-bg-tertiary);
}
.admin-property-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.admin-property-tr-tags .admin-property-cell {
  align-items: center;
}
.admin-property-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  cursor: text;
  min-height: 1.75rem;
}
.admin-property-tag-input {
  flex: 1;
  min-width: 4em;
  padding: 0;
  border: none;
  background: transparent;
  font-size: inherit;
  color: var(--color-text-primary);
  outline: none;
}
.admin-property-tag-input::placeholder {
  color: var(--color-text-tertiary);
}

/* Hero image: below table, above editor (blog-style). Same size for filled and empty. */
.admin-hero-slot {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 1rem;
  margin-left: auto;
  margin-right: auto;
  max-width: 720px;
  width: 100%;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  aspect-ratio: 16 / 7;
  max-height: 300px;
  min-height: 0;
}
.admin-hero-slot.empty {
  border: 2px dashed var(--color-border-light);
}
.admin-hero-slot img {
  width: 100%;
  height: 100%;
  max-height: 300px;
  display: block;
  aspect-ratio: 16 / 7;
  object-fit: cover;
  object-position: center;
}
.admin-hero-empty-label {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
}
.admin-hero-title-wrap {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 0.9rem;
  display: flex;
  justify-content: flex-start;
  pointer-events: none;
}
.admin-hero-title {
  margin: 0;
  padding: 0.45rem 0.85rem;
  max-width: min(92%, 760px);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-bg-primary) 45%, transparent);
  backdrop-filter: blur(8px) saturate(1.1);
  -webkit-backdrop-filter: blur(8px) saturate(1.1);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 68%, transparent);
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
}

/* Chips (shared) */
.admin-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border-radius: 999px;
}
.admin-meta-chip-series {
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
}
.admin-meta-chip-remove {
  padding: 0;
  margin-left: 0.15rem;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  opacity: 0.8;
}
.admin-meta-chip-remove:hover {
  opacity: 1;
}

/* Author layout */
.admin-editor-meta-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
}
.admin-editor-meta-wrap .admin-editor-meta {
  flex: 0 1 auto;
}
.admin-editor-meta-wrap .admin-editor-main {
  flex: 1;
  min-width: 280px;
}

.admin-editor-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem 1.25rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
}
.admin-editor-meta .admin-form-row {
  min-width: 140px;
  flex: 1;
  max-width: 280px;
}
.admin-form-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.admin-form-row label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}
.admin-input,
.admin-input-group {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-border-light);
  border-radius: 0.25rem;
  font-size: 0.875rem;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}
.admin-input-group {
  display: flex;
  gap: 0.25rem;
  padding: 0;
}
.admin-input-group .admin-input {
  flex: 1;
  border: none;
  border-radius: 0;
}
.admin-input-group .admin-input:first-child {
  border-left: 1px solid var(--color-border-light);
  border-radius: 0.25rem 0 0 0.25rem;
}
.admin-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.admin-editor-tabs {
  display: flex;
  gap: 0.25rem;
}
.admin-tab {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.admin-tab:hover {
  background: var(--color-bg-tertiary);
}
.admin-tab.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.admin-editor-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.admin-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.admin-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}
.admin-btn-ghost {
  border-color: transparent;
  background: transparent;
}
.admin-btn-ghost:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
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
.admin-btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}
.admin-wysiwyg-site {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  min-height: 50vh;
}
.admin-editor-loading {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}
.admin-editor-wysiwyg,
.admin-editor-raw {
  display: flex;
  flex-direction: column;
  min-height: 50vh;
}
.admin-editor-wysiwyg {
  overflow: visible;
}
.admin-editor-raw {
  overflow: visible;
}
.admin-textarea {
  width: 100%;
  min-height: 50vh;
  padding: 0 0.25rem;
  border: none;
  resize: none;
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.8;
  background: transparent;
  color: var(--color-text-primary);
}
/* Editor area: no box, fill available space */
.admin-wysiwyg-site :deep(.milkdown),
.admin-wysiwyg-site :deep([data-milkdown-root]) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  min-height: 100%;
}
/* Match blog .post-content typography inside the WYSIWYG editor */
.admin-wysiwyg-site :deep(.milkdown) {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown p) {
  margin-bottom: 1.25rem;
}
.admin-wysiwyg-site :deep(.milkdown h1) {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown h2) {
  font-size: 2rem;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border-light);
}
.admin-wysiwyg-site :deep(.milkdown h3) {
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown h4),
.admin-wysiwyg-site :deep(.milkdown h5),
.admin-wysiwyg-site :deep(.milkdown h6) {
  font-size: 1.25rem;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown a) {
  color: var(--color-primary-dark);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.admin-wysiwyg-site :deep(.milkdown ul),
.admin-wysiwyg-site :deep(.milkdown ol) {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}
.admin-wysiwyg-site :deep(.milkdown li) {
  margin-bottom: 0.5rem;
}
.admin-wysiwyg-site :deep(.milkdown blockquote) {
  border-left: 4px solid var(--color-accent);
  padding-left: 1.5rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  padding: 1rem 1.5rem;
  border-radius: 0 8px 8px 0;
}
.admin-wysiwyg-site :deep(.milkdown img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
.admin-wysiwyg-site :deep(.milkdown pre) {
  background: var(--color-bg-tertiary);
  padding: 1rem;
  border-radius: 8px;
  overflow: auto;
  margin: 1rem 0;
}
.admin-wysiwyg-site :deep(.milkdown code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--color-bg-tertiary);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}
.admin-wysiwyg-site :deep(.milkdown hr) {
  border: none;
  border-top: 2px solid var(--color-border-light);
  margin: 2rem 0;
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
  border-radius: 0.5rem;
  min-width: 560px;
  width: 85vw;
  max-width: 900px;
  min-height: 420px;
  max-height: 85vh;
  overflow: auto;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}
.image-picker-panel .image-picker {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.image-picker-panel .image-picker-list {
  flex: 1;
  min-height: 320px;
}
.image-picker-panel h3 {
  margin: 0 0 1rem;
  font-size: 1.125rem;
}
.mt-2 { margin-top: 0.5rem; }
</style>
