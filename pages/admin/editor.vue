<template>
  <div class="admin-editor-page">
    <!-- 狀態：儲存中… / 已儲存至本機 / 已同步。按鈕：儲存草稿、取消發布（僅已發布）、發布變更。 -->
    <Teleport to="#admin-editor-nav-actions">
      <span
        class="admin-status-dot-wrap"
        :class="editorStatusClass"
        :title="editorStatusLabel"
        aria-label="儲存狀態"
      >
        <Icon v-if="saveStatus === 'loading' || saveStatus === 'typing'" name="heroicons:arrow-path" size="12" class="admin-status-spinner" />
        <span v-else class="admin-status-dot" />
      </span>
      <template v-if="docType === 'post'">
        <button v-if="!isPublishedPost" type="button" class="admin-btn admin-btn-ghost" :disabled="savingDraft || saving || !canEditPost" @click="saveDraftToGitHub">
          {{ savingDraft ? "儲存中…" : "儲存草稿" }}
        </button>
        <button v-if="isPublishedPost" type="button" class="admin-btn admin-btn-ghost" :disabled="saving || unpublishing || !canEditPost" @click="unpublish">
          {{ unpublishing ? "處理中…" : "取消發布" }}
        </button>
        <button v-if="showDeleteDraftButton" type="button" class="admin-btn admin-btn-ghost" :disabled="deletingDraft || !canEditPost" @click="openDeleteDraftConfirm">
          刪除草稿
        </button>
        <button type="button" class="admin-btn admin-btn-primary" :disabled="saving || !canEditPost || (isPublishedPost && !hasUnsavedChanges)" :title="canEditPost ? '' : '您只能編輯自己的文章'" @click="publish">
          {{ saving ? "正在同步至 GitHub…" : publishButtonLabel }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="admin-btn admin-btn-primary" :disabled="saving || !canEditPost" @click="publish">
          {{ saving ? "儲存中…" : "儲存" }}
        </button>
      </template>
    </Teleport>

    <!-- Fixed toolbar in top nav (middle): icons + hover dropdowns. Only in WYSIWYG when editor ready. -->
    <Teleport to="#admin-editor-toolbar">
      <template v-if="showFixedToolbar">
        <AdminEditorToolbar :api="milkdownRef" />
      </template>
    </Teleport>

    <div v-if="docType === 'post' && !canEditPost && pathQuery" class="admin-editor-readonly-hint">
      此文章作者 ID 為「{{ meta.author }}」，您只能檢視；儲存按鈕已停用。
    </div>
    <div v-else-if="docType === 'post' && isPublishedPost" class="admin-editor-published-hint">
      已發布文章可直接編輯，變更會先存於本機；點擊「發布變更」同步至 GitHub。
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

        <!-- Featured image: drop zone + upload or paste URL. No media library. -->
        <div
          class="admin-hero-slot admin-hero-upload"
          :class="{ empty: !meta.featured_image, 'admin-hero-uploading': featuredUploading }"
          @dragover.prevent="heroDragOver = true"
          @dragleave="heroDragOver = false"
          @drop.prevent="onFeaturedDrop"
          @click="featuredFileInput?.click()"
        >
          <input
            ref="featuredFileInput"
            type="file"
            accept="image/*"
            class="admin-hero-file-input"
            @change="onFeaturedFileChange"
          >
          <template v-if="meta.featured_image">
            <img :src="meta.featured_image" :alt="meta.title || '精選圖片'" >
            <div class="admin-hero-title-wrap">
              <h2 class="admin-hero-title">{{ meta.title || "未命名" }}</h2>
            </div>
            <div class="admin-hero-replace-hint">點擊或拖曳替換</div>
          </template>
          <template v-else>
            <span class="admin-hero-empty-label">拖曳圖片到這裡，或點擊上傳</span>
            <span v-if="featuredUploading" class="admin-hero-uploading-label">上傳中…</span>
          </template>
        </div>

        <!-- Editor full width -->
        <div class="admin-editor-main">
          <div class="admin-wysiwyg-site">
            <div v-show="viewMode === 'wysiwyg'" class="admin-editor-wysiwyg">
              <ClientOnly>
                <AdminMilkdownEditor
                  v-if="contentReady"
                  :key="`editor-${pathQuery || slug || 'new'}-${editorMountKey}`"
                  ref="milkdownRef"
                  :default-value="body"
                  @ready="onEditorReady"
                  @markdown-change="onMilkdownMarkdownChange"
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
            <label>頭像</label>
            <div class="admin-input-group admin-upload-row">
              <input v-model="meta.avatar" type="text" class="admin-input" placeholder="/images/uploads/avatar.png" >
              <input ref="authorAvatarFileInput" type="file" accept="image/*" class="admin-upload-hidden" @change="onAuthorAvatarFileChange">
              <button type="button" class="admin-btn admin-btn-sm" :disabled="avatarUploading" @click="authorAvatarFileInput?.click()">
                {{ avatarUploading ? "上傳中…" : "上傳" }}
              </button>
            </div>
          </div>
          <div class="admin-form-row">
            <label>橫幅</label>
            <div class="admin-input-group admin-upload-row">
              <input v-model="meta.banner" type="text" class="admin-input" placeholder="/images/uploads/banner.jpg" >
              <input ref="authorBannerFileInput" type="file" accept="image/*" class="admin-upload-hidden" @change="onAuthorBannerFileChange">
              <button type="button" class="admin-btn admin-btn-sm" :disabled="bannerUploading" @click="authorBannerFileInput?.click()">
                {{ bannerUploading ? "上傳中…" : "上傳" }}
              </button>
            </div>
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
                :key="`editor-${pathQuery || slug || 'new'}-${editorMountKey}`"
                ref="milkdownRef"
                :default-value="body"
                @ready="onEditorReady"
                @markdown-change="onMilkdownMarkdownChange"
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

    <!-- 本機較新版本恢復列：僅在 content/drafts/ 且 local savedAt > server 時顯示 -->
    <div v-if="showRecoveryBar" class="admin-recovery-bar">
      <span class="admin-recovery-text">我們在此裝置上發現較新的未儲存版本。</span>
      <div class="admin-recovery-actions">
        <button type="button" class="admin-btn admin-btn-primary admin-btn-sm" @click="restoreLocalVersion">還原本機版本</button>
        <button type="button" class="admin-btn admin-btn-ghost admin-btn-sm" @click="discardLocalVersion">捨棄本機變更</button>
      </div>
    </div>

    <!-- 已發布/草稿 + 本機有版本：選擇使用 GitHub 版本或本機版本 -->
    <Teleport to="body">
      <div v-if="showVersionChoiceModal" class="admin-confirm-overlay" @click.self="useGitHubVersion">
        <div class="admin-confirm-modal" @click.stop>
          <h3 class="admin-confirm-title">選擇版本</h3>
          <p class="admin-confirm-text">{{ versionChoiceIsDraft ? "此草稿在 GitHub 與本機都有版本。要使用哪一個？" : "此文章在 GitHub 已發布，且本機有未同步的版本。要使用哪一個？" }}</p>
          <div class="admin-confirm-actions">
            <button type="button" class="admin-btn admin-btn-primary" @click="useGitHubVersion">使用 GitHub 上的版本</button>
            <button type="button" class="admin-btn admin-btn-ghost" @click="useLocalVersion">使用本機版本</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 刪除草稿確認（點擊背景不關閉，改為晃動提示） -->
    <Teleport to="body">
      <div
        v-if="showDeleteDraftConfirm"
        class="admin-confirm-overlay"
        role="presentation"
        @click="onDeleteConfirmOverlayClick"
      >
        <div
          class="admin-confirm-modal admin-confirm-modal-danger"
          :class="{ 'admin-confirm-modal-shake': deleteModalShake }"
          role="dialog"
          aria-modal="true"
          @click.stop
        >
          <h3 class="admin-confirm-title">刪除草稿</h3>
          <p class="admin-confirm-text">確定要刪除此草稿嗎？此操作無法復原。</p>
          <div class="admin-confirm-actions admin-confirm-actions-rounded">
            <button type="button" class="admin-btn admin-btn-ghost" @click="showDeleteDraftConfirm = false">取消</button>
            <button type="button" class="admin-btn admin-btn-primary admin-btn-danger" @click="confirmDeleteDraft">刪除</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import type { EditorToolbarApi } from "~/components/admin/MilkdownEditorInner.vue";

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
const milkdownRef = ref<EditorToolbarApi | null>(null);
const getMarkdownRef = ref<(() => string) | null>(null);
/** Show fixed icon toolbar in top nav when in WYSIWYG and editor is ready. */
const showFixedToolbar = computed(
  () =>
    viewMode.value === "wysiwyg" &&
    (docType.value === "post" || docType.value === "author") &&
    contentReady.value
);
/** When true, rawBody was just set from Milkdown — skip pushing back to Milkdown in rawBody watcher. */
const rawBodyUpdateFromMilkdown = ref(false);
const authors = ref<{ name: string; path: string; displayName?: string }[]>([]);
const saving = ref(false);
const propertiesOpen = ref(true);
const { uploadImage, uploading: featuredUploading } = useUploadImage();
const { uploadImage: uploadImageAvatar, uploading: avatarUploading } = useUploadImage();
const { uploadImage: uploadImageBanner, uploading: bannerUploading } = useUploadImage();
const featuredFileInput = ref<HTMLInputElement | null>(null);
const authorAvatarFileInput = ref<HTMLInputElement | null>(null);
const authorBannerFileInput = ref<HTMLInputElement | null>(null);
const heroDragOver = ref(false);
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

/** 目前編輯的是已發布文章（路徑在 content/blog/）。不依賴 fileSha，避免載入前誤判。 */
const isPublishedPost = computed(
  () =>
    docType.value === "post" &&
    !!pathQuery.value &&
    pathQuery.value.startsWith("content/blog/")
);

/** 文章目前在 GitHub 的 content/drafts/（草稿）。 */
const isDraftOnGitHub = computed(
  () => docType.value === "post" && !!pathQuery.value && pathQuery.value.startsWith("content/drafts/")
);

/** 顯示「刪除草稿」按鈕：目前為草稿（未發布）且為文章。 */
const showDeleteDraftButton = computed(
  () => docType.value === "post" && !isPublishedPost.value
);

const draftKey = computed(() => `admin-draft-${docType.value}-${pathQuery.value || slug.value || "new"}`);

/** Last saved meta/body for dirty check (vs server). Meta is reactive; body needs polling (Milkdown has no change event). */
const lastSavedMetaJson = ref<string | null>(null);
const lastSavedBody = ref<string | null>(null);
/** Cached serialized meta, updated only when meta changes (trigger-based). */
const cachedMetaJson = ref("");
/** Bump every 2s to re-check body from Milkdown (no editor change event). */
const bodyCheckTrigger = ref(0);
let bodyCheckInterval: ReturnType<typeof setInterval> | null = null;

/** 正在輸入尚未寫入 localStorage（1s 防抖後會寫入）。 */
const isDirty = ref(false);
let debounceSaveTimer: ReturnType<typeof setTimeout> | null = null;
/** 上次寫入 localStorage 的內容快照，用於判斷是否需要儲存。 */
const lastSavedToLocalSnapshot = ref("");
const savingDraft = ref(false);
const unpublishing = ref(false);
const deletingDraft = ref(false);
const showDeleteDraftConfirm = ref(false);
/** Shake delete modal when user clicks backdrop (destructive action — must choose). */
const deleteModalShake = ref(false);
let deleteModalShakeTimeout: ReturnType<typeof setTimeout> | null = null;

function onDeleteConfirmOverlayClick(e: MouseEvent) {
  if (e.target !== e.currentTarget) return;
  e.preventDefault();
  e.stopPropagation();
  deleteModalShake.value = true;
  if (deleteModalShakeTimeout) clearTimeout(deleteModalShakeTimeout);
  deleteModalShakeTimeout = setTimeout(() => {
    deleteModalShake.value = false;
    deleteModalShakeTimeout = null;
  }, 500);
}
const showRecoveryBar = ref(false);
/** 已發布文章或 GitHub 草稿 + 本機有版本時，詢問使用 GitHub 版本或本機版本。 */
const showVersionChoiceModal = ref(false);
/** 版本選擇情境為「GitHub 草稿 vs 本機草稿」（true）或「已發布 vs 本機」（false）。 */
const versionChoiceIsDraft = computed(() => !!pathQuery.value?.startsWith("content/drafts/"));
/** 為 true 時不寫入 localStorage，避免載入 API 後觸發 watcher 覆蓋本機草稿。 */
const versionChoicePending = ref(false);
/** 載入時若本機較新，存 server 的 lastModified 供恢復列比較。 */
const serverLastModified = ref<string | null>(null);
/** 選擇「使用本機版本」時遞增，強制編輯器重新掛載以讀取 body。 */
const editorMountKey = ref(0);
let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;

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

/** 是否為已發布路徑（content/blog/）。此類文章不寫入 localStorage，且載入中顯示「載入中…」。 */
const isPublishedPath = computed(
  () => docType.value === "post" && !!pathQuery.value && pathQuery.value.startsWith("content/blog/")
);

/** 狀態：loading=載入中 / typing=儲存中… / saved=已儲存至本機 / synced=已同步。 */
const saveStatus = computed<"loading" | "typing" | "saved" | "synced" | "draft">(() => {
  if (docType.value !== "post") return "draft";
  if (!contentReady.value && isPublishedPath.value) return "loading";
  if (isDirty.value) return "typing";
  if (isPublishedPath.value && !hasUnsavedChanges.value) return "synced";
  if (isPublishedPath.value && hasUnsavedChanges.value) return "saved";
  return "saved";
});
const editorStatusClass = computed(() => {
  if (saveStatus.value === "loading") return "status-typing";
  if (saveStatus.value === "typing") return "status-typing";
  if (saveStatus.value === "saved") return "status-saved";
  if (saveStatus.value === "synced") return "status-synced";
  return "draft";
});
const editorStatusLabel = computed(() => {
  if (saveStatus.value === "loading") return "載入中…";
  if (saveStatus.value === "typing") return "儲存中…";
  if (saveStatus.value === "saved" && isPublishedPath.value) return "本機有未同步變更";
  if (saveStatus.value === "saved") return "已儲存至本機";
  if (saveStatus.value === "synced") return "已同步";
  return "草稿";
});
const publishButtonLabel = computed(() => {
  if (docType.value !== "post") return "儲存";
  if (saving.value) return "正在同步至 GitHub…";
  if (isPublishedPost.value && !hasUnsavedChanges.value) return "已發布";
  return "發布變更";
});

function onEditorReady(api: EditorToolbarApi) {
  getMarkdownRef.value = api.getMarkdown;
}

function onMilkdownMarkdownChange(markdown: string) {
  rawBodyUpdateFromMilkdown.value = true;
  rawBody.value = markdown;
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
  if (versionChoicePending.value) return;
  if (docType.value === "post" && !canEditPost.value) return;
  const content = getBodyContent();
  const data = { meta: { ...meta }, body: content, savedAt: Date.now() };
  try {
    localStorage.setItem(draftKey.value, JSON.stringify(data));
    lastSavedToLocalSnapshot.value = serializeMeta() + "\n" + normalizeBodyForCompare(content);
    isDirty.value = false;
  } catch (e) {
    console.error(e);
  }
}

/** 有變更尚未寫入 localStorage 時排程 1s 後寫入。已發布文章也會寫入本機作為恢復用。非作者不自動儲存。 */
function scheduleDebouncedLocalSave() {
  if (versionChoicePending.value) return;
  if (docType.value !== "post" && docType.value !== "author") return;
  if (docType.value === "post" && !canEditPost.value) return;
  const snapshot = serializeMeta() + "\n" + normalizeBodyForCompare(getBodyContent());
  if (snapshot === lastSavedToLocalSnapshot.value) return;
  isDirty.value = true;
  if (debounceSaveTimer) clearTimeout(debounceSaveTimer);
  debounceSaveTimer = setTimeout(() => {
    saveDraft();
    debounceSaveTimer = null;
  }, 1000);
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
    lastSavedToLocalSnapshot.value = serializeMeta() + "\n" + normalizeBodyForCompare(body.value);
  } catch {
    // ignore
  }
}

function restoreLocalVersion() {
  loadDraft();
  showRecoveryBar.value = false;
  serverLastModified.value = null;
  nextTick(() => {
    lastSavedMetaJson.value = serializeMeta();
    lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
    setTimeout(() => {
      lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
    }, 600);
  });
}

function discardLocalVersion() {
  try {
    localStorage.removeItem(draftKey.value);
  } catch {
    /* ignore */
  }
  showRecoveryBar.value = false;
  serverLastModified.value = null;
  lastSavedToLocalSnapshot.value = serializeMeta() + "\n" + normalizeBodyForCompare(getBodyContent());
}

/** 版本選擇：使用 GitHub 上的已發布版本（捨棄本機草稿）。 */
function useGitHubVersion() {
  versionChoicePending.value = false;
  try {
    localStorage.removeItem(draftKey.value);
  } catch {
    /* ignore */
  }
  showVersionChoiceModal.value = false;
  serverLastModified.value = null;
  lastSavedToLocalSnapshot.value = serializeMeta() + "\n" + normalizeBodyForCompare(getBodyContent());
  contentReady.value = true;
  nextTick(() => {
    setTimeout(() => {
      lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
    }, 600);
  });
}

/** 版本選擇：使用本機版本（載入草稿）。先關閉編輯器、載入本機、再重新掛載以確保顯示本機內容。 */
function useLocalVersion() {
  versionChoicePending.value = false;
  showVersionChoiceModal.value = false;
  contentReady.value = false;
  nextTick(() => {
    loadDraft();
    editorMountKey.value += 1;
    nextTick(() => {
      contentReady.value = true;
      lastSavedMetaJson.value = serializeMeta();
      lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
      serverLastModified.value = null;
      nextTick(() => {
        lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
        setTimeout(() => {
          lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
        }, 600);
      });
    });
  });
}

function loadFromApi(): Promise<void> {
  if (!filePath.value) {
    if (docType.value === "post") {
      meta.date = new Date().toISOString().slice(0, 16);
    }
    loadDraft();
    nextTick(() => {
      cachedMetaJson.value = serializeMeta();
    });
    contentReady.value = true;
    return Promise.resolve();
  }
  return $fetch<{ content: string; sha?: string; lastModified?: string }>(`/api/admin/repo/files?path=${encodeURIComponent(filePath.value)}`)
    .then((res) => {
      fileSha.value = res.sha;
      serverLastModified.value = res.lastModified ?? null;
      const raw = res.content || "";
      const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
      const rawDraftForChoice = typeof localStorage !== "undefined" ? localStorage.getItem(draftKey.value) : null;
      const willShowVersionChoice = !!(rawDraftForChoice && docType.value === "post" && (pathQuery.value?.startsWith("content/blog/") || pathQuery.value?.startsWith("content/drafts/")));
      if (willShowVersionChoice) {
        versionChoicePending.value = true;
        if (debounceSaveTimer) {
          clearTimeout(debounceSaveTimer);
          debounceSaveTimer = null;
        }
      }
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
        lastSavedToLocalSnapshot.value = serializeMeta() + "\n" + normalizeBodyForCompare(getBodyContent());
        const serverAuthor = meta.author;
        const rawDraft = typeof localStorage !== "undefined" ? localStorage.getItem(draftKey.value) : null;
        if (rawDraft && docType.value === "post") {
          if (pathQuery.value && (pathQuery.value.startsWith("content/blog/") || pathQuery.value.startsWith("content/drafts/"))) {
            showVersionChoiceModal.value = true;
            return;
          }
          if (serverLastModified.value) {
            try {
              const draft = JSON.parse(rawDraft);
              const localSavedAt = typeof draft.savedAt === "number" ? draft.savedAt : 0;
              const serverTime = new Date(serverLastModified.value).getTime();
              if (localSavedAt > serverTime) {
                showRecoveryBar.value = true;
                if (serverAuthor !== undefined) meta.author = serverAuthor;
                contentReady.value = true;
                setTimeout(() => {
                  lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
                }, 600);
                return;
              }
            } catch {
              /* ignore */
            }
          }
        }
        if (rawDraft && docType.value === "author") {
          loadDraft();
          if (serverAuthor !== undefined) meta.author = serverAuthor;
        }
        setTimeout(() => {
          lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
        }, 600);
        contentReady.value = true;
      });
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
    if (docType.value === "post" && isDraftOnGitHub.value && pathQuery.value) {
      const fromPath = pathQuery.value;
      const stem = meta.path?.replace(/^\/blog\/?/, "").trim() || slugifyTitle(meta.title);
      const toPath = `content/blog/${stem}.md`;
      const res = await $fetch<{ sha?: string }>("/api/admin/repo/files-move", {
        method: "POST",
        body: { fromPath, toPath, message: `Publish: move ${fromPath} to ${toPath}` },
      });
      fileSha.value = res?.sha;
      try {
        localStorage.removeItem(draftKey.value);
        localStorage.removeItem(`admin-draft-post-${toPath}`);
      } catch {
        /* ignore */
      }
      captureLastSavedSnapshot();
      lastSavedToLocalSnapshot.value = serializeMeta() + "\n" + normalizeBodyForCompare(getBodyContent());
      await navigateTo({ path: "/admin/editor", query: { type: "post", path: toPath } });
    } else {
      const res = await $fetch<{ sha?: string }>("/api/admin/repo/files", {
        method: "PUT",
        body: { path, content, sha: fileSha.value, message: pathQuery.value ? `Update ${path}` : `Publish ${path}` },
      });
      fileSha.value = res?.sha ?? fileSha.value;
      try {
        localStorage.removeItem(draftKey.value);
        if (docType.value === "post" && path) {
          localStorage.removeItem(`admin-draft-post-${path}`);
        }
      } catch {
        /* ignore */
      }
      captureLastSavedSnapshot();
      lastSavedToLocalSnapshot.value = serializeMeta() + "\n" + normalizeBodyForCompare(getBodyContent());
      if (!pathQuery.value && docType.value === "post") {
        const stem = meta.path?.replace(/^\/blog\/?/, "").trim() || slugifyTitle(meta.title);
        await navigateTo({ path: "/admin/editor", query: { type: "post", path: `content/blog/${stem}.md` } });
      } else if (slug.value) {
        loadFromApi();
      }
    }
  } catch (e) {
    console.error(e);
    alert("儲存失敗，請查看主控台。");
  } finally {
    saving.value = false;
  }
}

async function saveDraftToGitHub() {
  if (docType.value !== "post") return;
  if (!meta.title) syncTitleFromFirstH1();
  const stem = meta.path?.replace(/^\/blog\/?/, "").trim() || slugifyTitle(meta.title) || "untitled";
  const draftPath = `content/drafts/${stem}.md`;
  if (!meta.date) meta.date = new Date().toISOString().slice(0, 16);
  meta.author = currentUserAuthorId.value ?? meta.author;
  const content = `${buildFrontmatter()}\n\n${getBodyContent()}`;
  savingDraft.value = true;
  try {
    await $fetch("/api/admin/repo/files", {
      method: "PUT",
      body: {
        path: draftPath,
        content,
        sha: isDraftOnGitHub.value && pathQuery.value === draftPath ? fileSha.value : undefined,
        message: pathQuery.value ? `Update draft ${draftPath}` : `Save draft ${draftPath}`,
      },
    });
    try {
      localStorage.removeItem(draftKey.value);
    } catch {
      /* ignore */
    }
    captureLastSavedSnapshot();
    lastSavedToLocalSnapshot.value = serializeMeta() + "\n" + normalizeBodyForCompare(getBodyContent());
    await navigateTo({ path: "/admin/editor", query: { type: "post", path: draftPath } });
  } catch (e) {
    console.error(e);
    alert("儲存草稿失敗，請查看主控台。");
  } finally {
    savingDraft.value = false;
  }
}

async function unpublish() {
  if (docType.value !== "post" || !pathQuery.value || !pathQuery.value.startsWith("content/blog/")) return;
  if (!canEditPost.value) return;
  const fromPath = pathQuery.value;
  const stem = fromPath.replace(/^content\/blog\//, "").replace(/\.md$/, "");
  const toPath = `content/drafts/${stem}`;
  unpublishing.value = true;
  try {
    await $fetch("/api/admin/repo/files-move", {
      method: "POST",
      body: { fromPath, toPath: toPath.endsWith(".md") ? toPath : `${toPath}.md`, message: `Unpublish: move to drafts` },
    });
    try {
      localStorage.removeItem(draftKey.value);
    } catch {
      /* ignore */
    }
    await navigateTo({ path: "/admin/editor", query: { type: "post", path: `content/drafts/${stem}.md` } });
  } catch (e) {
    console.error(e);
    alert("取消發布失敗，請查看主控台。");
  } finally {
    unpublishing.value = false;
  }
}

function openDeleteDraftConfirm() {
  showDeleteDraftConfirm.value = true;
}

async function confirmDeleteDraft() {
  if (!canEditPost.value) return;
  showDeleteDraftConfirm.value = false;
  deletingDraft.value = true;
  try {
    if (isDraftOnGitHub.value && pathQuery.value) {
      let sha = fileSha.value;
      if (!sha) {
        const fileRes = await $fetch<{ sha?: string }>(`/api/admin/repo/files?path=${encodeURIComponent(pathQuery.value)}`);
        sha = fileRes?.sha;
      }
      if (sha) {
        await $fetch("/api/admin/repo/files-delete", {
          method: "POST",
          body: {
            path: pathQuery.value,
            sha,
            message: `Delete draft ${pathQuery.value}`,
          },
        });
      } else {
        alert("無法取得檔案 SHA，請重新開啟此草稿後再試。");
        deletingDraft.value = false;
        return;
      }
    }
    try {
      localStorage.removeItem(draftKey.value);
    } catch {
      /* ignore */
    }
    await navigateTo({ path: "/admin/posts" });
  } catch (e) {
    console.error(e);
    alert("刪除草稿失敗，請查看主控台。");
  } finally {
    deletingDraft.value = false;
  }
}

async function onFeaturedDrop(e: DragEvent) {
  heroDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file?.type.startsWith("image/")) return;
  try {
    meta.featured_image = await uploadImage(file);
  } catch (err) {
    console.error(err);
    alert("上傳失敗");
  }
}

function onFeaturedFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  uploadImage(file).then((path) => { meta.featured_image = path; }).catch((err) => { console.error(err); alert("上傳失敗"); });
}

async function onAuthorAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    meta.avatar = await uploadImageAvatar(file);
  } catch (err) {
    console.error(err);
    alert("上傳失敗");
  }
}

async function onAuthorBannerFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    meta.banner = await uploadImageBanner(file);
  } catch (err) {
    console.error(err);
    alert("上傳失敗");
  }
}

watch(
  meta,
  () => {
    cachedMetaJson.value = serializeMeta();
    if (docType.value === "post" && !canEditPost.value) return;
    scheduleDebouncedLocalSave();
  },
  { deep: true }
);


onMounted(async () => {
  $fetch<{ name: string; path: string; displayName?: string }[]>("/api/admin/repo/authors")
    .then((list) => (authors.value = list))
    .catch(() => (authors.value = []));
  const profilePromise = $fetch<{ authorId?: string | null }>("/api/admin/profile/me")
    .then((profile) => {
      currentUserAuthorId.value = profile?.authorId ?? null;
    })
    .catch(() => {
      currentUserAuthorId.value = null;
    });
  await Promise.all([profilePromise, loadFromApi()]);
  bodyCheckInterval = setInterval(() => {
    bodyCheckTrigger.value++;
    if (docType.value === "post" && !canEditPost.value) return;
    scheduleDebouncedLocalSave();
  }, 2000);
  beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    if (docType.value === "post" && pathQuery.value?.startsWith("content/blog/") && hasUnsavedChanges.value) {
      e.preventDefault();
      (e as BeforeUnloadEvent & { returnValue?: string }).returnValue = "";
    }
  };
  window.addEventListener("beforeunload", beforeUnloadHandler);
});

/** Resize raw markdown textarea to fit content (no inner scrollbar). */
function resizeRawTextarea() {
  nextTick(() => {
    document.querySelectorAll<HTMLTextAreaElement>(".admin-textarea").forEach((el) => {
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 50 * 16)}px`; /* at least 50vh in px approx */
    });
  });
}

watch(rawBody, () => {
  if (rawBodyUpdateFromMilkdown.value) {
    rawBodyUpdateFromMilkdown.value = false;
    scheduleDebouncedLocalSave();
    resizeRawTextarea();
    return;
  }
  if (docType.value === "post" && !canEditPost.value) return;
  scheduleDebouncedLocalSave();
  resizeRawTextarea();
  /* Do not push rawBody → Milkdown on every keystroke; it causes newlines and cursor jumps.
   * Sync only when switching to wysiwyg (see viewMode watcher). */
}, { flush: "post" });

watch(viewMode, (mode, prevMode) => {
  if (mode === "raw") {
    resizeRawTextarea();
    return;
  }
  /* Switching to wysiwyg: push current raw markdown into Milkdown so both stay in sync. */
  if (prevMode === "raw") {
    nextTick(() => {
      milkdownRef.value?.setMarkdown?.(rawBody.value);
    });
  }
});

watch(pathQuery, (newPath, oldPath) => {
  if (newPath === oldPath) return;
  if (filePath.value) {
    contentReady.value = false;
    loadFromApi().finally(() => {
      contentReady.value = true;
    });
  }
});

onUnmounted(() => {
  if (bodyCheckInterval) clearInterval(bodyCheckInterval);
  if (debounceSaveTimer) clearTimeout(debounceSaveTimer);
  if (beforeUnloadHandler) {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    beforeUnloadHandler = null;
  }
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
.admin-editor-published-hint {
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
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
  min-width: 0;
  overflow: visible;
  min-height: 60vh;
  /* No flex: 1 — let editor grow with content so page scrolls instead of inner scrollbar */
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
/* Fixed-size status indicator (dot or spinner) so toolbar doesn’t jump */
.admin-status-dot-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border-radius: 50%;
}
.admin-status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
}
.admin-status-spinner {
  animation: admin-spin 0.8s linear infinite;
}
@keyframes admin-spin {
  to { transform: rotate(360deg); }
}
.admin-status-dot-wrap.draft {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
.admin-status-dot-wrap.status-typing {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
.admin-status-dot-wrap.status-saved {
  background: color-mix(in srgb, #16a34a 22%, transparent);
  color: #16a34a;
}
.admin-status-dot-wrap.status-synced {
  background: color-mix(in srgb, #2563eb 22%, transparent);
  color: #2563eb;
}

/* 本機較新版本恢復列 */
.admin-recovery-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}
.admin-recovery-text {
  font-size: 0.875rem;
  color: var(--color-text-primary);
}
.admin-recovery-actions {
  display: flex;
  gap: 0.5rem;
}

/* 確認視窗（版本選擇、刪除草稿） */
.admin-confirm-overlay {
  position: fixed;
  inset: 0;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
  cursor: default;
  pointer-events: auto;
}
.admin-confirm-modal {
  background: var(--color-bg-primary);
  padding: 1.5rem 1.75rem;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--color-border-light);
  max-width: 28rem;
  width: 100%;
}
.admin-confirm-modal-danger .admin-confirm-title {
  color: #b91c1c;
}
.admin-confirm-title {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}
.admin-confirm-text {
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.55;
}
.admin-confirm-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.admin-confirm-actions .admin-btn {
  min-width: 6rem;
}

/* Delete modal: rounded-square buttons; backdrop click triggers shake (do not close) */
.admin-confirm-modal-shake {
  animation: admin-confirm-shake 0.5s ease-in-out;
}
@keyframes admin-confirm-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(8px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
  90% { transform: translateX(3px); }
}
.admin-confirm-modal-danger .admin-confirm-actions-rounded {
  gap: 1rem;
}
.admin-confirm-modal-danger .admin-confirm-actions-rounded .admin-btn {
  width: 4rem;
  height: 4rem;
  min-width: unset;
  padding: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
.admin-hero-upload {
  cursor: pointer;
}
.admin-hero-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.admin-hero-replace-hint {
  position: absolute;
  bottom: 0.5rem;
  right: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  pointer-events: none;
}
.admin-hero-uploading-label {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-primary);
}
.admin-hero-uploading {
  opacity: 0.85;
}
.admin-upload-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.admin-upload-row {
  position: relative;
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
.admin-btn-danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}
.admin-btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
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
  display: block;
  min-height: 50vh;
  overflow: visible;
}
/* Raw markdown textarea: match blog .post-content font/size; grows with content, no inner scroll */
.admin-textarea {
  width: 100%;
  min-height: 50vh;
  padding: 0 0.25rem;
  border: none;
  resize: none;
  overflow: hidden; /* Auto-grow via JS; no scrollbar */
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.8;
  background: transparent;
  color: var(--color-text-primary);
}
/* Editor area: full length, no inner scroll — page scrolls */
.admin-wysiwyg-site :deep(.milkdown),
.admin-wysiwyg-site :deep([data-milkdown-root]) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  min-height: 50vh;
  overflow: visible !important;
}
.admin-wysiwyg-site :deep(.milkdown .ProseMirror) {
  overflow: visible !important;
  min-height: 50vh;
}
/* Obsidian-style markdown reveal: grey source above focused block, hidden on blur */
.admin-wysiwyg-site :deep(.milkdown-markdown-reveal) {
  display: block;
  font-family: var(--mono-font, ui-monospace, monospace);
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-muted, #6b7280);
  margin-bottom: 0.25rem;
  padding: 0.25rem 0;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: none;
  pointer-events: none;
}
html.dark .admin-wysiwyg-site :deep(.milkdown-markdown-reveal) {
  color: var(--color-text-muted, #9ca3af);
}
/* Match blog .post-content typography inside the WYSIWYG editor (override Crepe theme) */
.admin-wysiwyg-site :deep(.milkdown) {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown .ProseMirror) {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown p),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror p) {
  margin-bottom: 1.25rem;
}
/* Headings: match main.css + .post-content (font-heading, distinct sizes, h2 bar) */
.admin-wysiwyg-site :deep(.milkdown h1),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror h1) {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.3;
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown h2),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror h2) {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border-light);
  position: relative;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown h2)::after,
.admin-wysiwyg-site :deep(.milkdown .ProseMirror h2)::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: var(--color-primary);
}
.admin-wysiwyg-site :deep(.milkdown h3),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror h3) {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown h4),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror h4) {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown h5),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror h5) {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown h6),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror h6) {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}
.admin-wysiwyg-site :deep(.milkdown a) {
  color: var(--color-primary-dark);
  text-decoration: underline;
  text-decoration-color: var(--color-primary-light);
  text-underline-offset: 3px;
  transition: color 0.2s ease, text-decoration-color 0.2s ease;
}
.admin-wysiwyg-site :deep(.milkdown a:hover) {
  color: var(--color-primary);
  text-decoration-color: var(--color-primary);
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
  border-radius: 12px;
  margin: 1.5rem 0;
  box-shadow: var(--shadow-md);
}
.admin-wysiwyg-site :deep(.milkdown figure) {
  margin: 1.5rem 0;
}
.admin-wysiwyg-site :deep(.milkdown figure img) {
  display: block;
  margin: 0;
}
.admin-wysiwyg-site :deep(.milkdown figcaption) {
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
  margin-top: 0.75rem;
  font-style: italic;
  line-height: 1.4;
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
/* Editor info-box: match blog .post-content (supports pasted HTML and ::: rendered as div by remark) */
.admin-wysiwyg-site :deep(.milkdown .info-box),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box) {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  border-left: 4px solid;
}
.admin-wysiwyg-site :deep(.milkdown .info-box strong),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box strong) {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}
.admin-wysiwyg-site :deep(.milkdown .info-box p),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box p) {
  margin: 0;
  line-height: 1.6;
}
.admin-wysiwyg-site :deep(.milkdown .info-box-info),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-info) {
  background: #e0f2fe;
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
}
.admin-wysiwyg-site :deep(.milkdown .info-box-success),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-success) {
  background: #d1fae5;
  border-color: #10b981;
  color: #059669;
}
.admin-wysiwyg-site :deep(.milkdown .info-box-warning),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-warning) {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #d97706;
}
.admin-wysiwyg-site :deep(.milkdown .info-box-error),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-error) {
  background: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
}
html.dark .admin-wysiwyg-site :deep(.milkdown .info-box-info),
html.dark .admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-info) {
  background: rgba(14, 165, 233, 0.18);
  border-color: #38bdf8;
  color: #bae6fd;
}
html.dark .admin-wysiwyg-site :deep(.milkdown .info-box-success),
html.dark .admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-success) {
  background: rgba(16, 185, 129, 0.18);
  border-color: #34d399;
  color: #bbf7d0;
}
html.dark .admin-wysiwyg-site :deep(.milkdown .info-box-warning),
html.dark .admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-warning) {
  background: rgba(245, 158, 11, 0.18);
  border-color: #fbbf24;
  color: #fcd34d;
}
html.dark .admin-wysiwyg-site :deep(.milkdown .info-box-error),
html.dark .admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-error) {
  background: rgba(239, 68, 68, 0.18);
  border-color: #f87171;
  color: #fecaca;
}
/* Colored label spans [text]{.class} in editor */
.admin-wysiwyg-site :deep(.milkdown span[data-span-class]),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror span[data-span-class]) {
  font-weight: 500;
}
/* Hue rows: red, orange, yellow, green, teal, blue, purple, pink, grey; 5 shades each (1=light, 5=dark) */
.admin-wysiwyg-site :deep(.milkdown span.red-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.red-1) { color: #fecaca; }
.admin-wysiwyg-site :deep(.milkdown span.red-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.red-2) { color: #f87171; }
.admin-wysiwyg-site :deep(.milkdown span.red-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.red-3) { color: #dc2626; }
.admin-wysiwyg-site :deep(.milkdown span.red-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.red-4) { color: #b91c1c; }
.admin-wysiwyg-site :deep(.milkdown span.red-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.red-5) { color: #7f1d1d; }
.admin-wysiwyg-site :deep(.milkdown span.orange-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.orange-1) { color: #fed7aa; }
.admin-wysiwyg-site :deep(.milkdown span.orange-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.orange-2) { color: #fb923c; }
.admin-wysiwyg-site :deep(.milkdown span.orange-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.orange-3) { color: #ea580c; }
.admin-wysiwyg-site :deep(.milkdown span.orange-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.orange-4) { color: #c2410c; }
.admin-wysiwyg-site :deep(.milkdown span.orange-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.orange-5) { color: #9a3412; }
.admin-wysiwyg-site :deep(.milkdown span.yellow-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.yellow-1) { color: #fef08a; }
.admin-wysiwyg-site :deep(.milkdown span.yellow-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.yellow-2) { color: #facc15; }
.admin-wysiwyg-site :deep(.milkdown span.yellow-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.yellow-3) { color: #eab308; }
.admin-wysiwyg-site :deep(.milkdown span.yellow-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.yellow-4) { color: #ca8a04; }
.admin-wysiwyg-site :deep(.milkdown span.yellow-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.yellow-5) { color: #a16207; }
.admin-wysiwyg-site :deep(.milkdown span.green-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.green-1) { color: #bbf7d0; }
.admin-wysiwyg-site :deep(.milkdown span.green-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.green-2) { color: #4ade80; }
.admin-wysiwyg-site :deep(.milkdown span.green-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.green-3) { color: #22c55e; }
.admin-wysiwyg-site :deep(.milkdown span.green-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.green-4) { color: #16a34a; }
.admin-wysiwyg-site :deep(.milkdown span.green-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.green-5) { color: #15803d; }
.admin-wysiwyg-site :deep(.milkdown span.teal-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.teal-1) { color: #99f6e4; }
.admin-wysiwyg-site :deep(.milkdown span.teal-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.teal-2) { color: #2dd4bf; }
.admin-wysiwyg-site :deep(.milkdown span.teal-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.teal-3) { color: #14b8a6; }
.admin-wysiwyg-site :deep(.milkdown span.teal-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.teal-4) { color: #0d9488; }
.admin-wysiwyg-site :deep(.milkdown span.teal-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.teal-5) { color: #0f766e; }
.admin-wysiwyg-site :deep(.milkdown span.blue-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.blue-1) { color: #bfdbfe; }
.admin-wysiwyg-site :deep(.milkdown span.blue-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.blue-2) { color: #60a5fa; }
.admin-wysiwyg-site :deep(.milkdown span.blue-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.blue-3) { color: #2563eb; }
.admin-wysiwyg-site :deep(.milkdown span.blue-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.blue-4) { color: #1d4ed8; }
.admin-wysiwyg-site :deep(.milkdown span.blue-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.blue-5) { color: #1e3a8a; }
.admin-wysiwyg-site :deep(.milkdown span.purple-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.purple-1) { color: #e9d5ff; }
.admin-wysiwyg-site :deep(.milkdown span.purple-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.purple-2) { color: #c084fc; }
.admin-wysiwyg-site :deep(.milkdown span.purple-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.purple-3) { color: #a855f7; }
.admin-wysiwyg-site :deep(.milkdown span.purple-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.purple-4) { color: #7c3aed; }
.admin-wysiwyg-site :deep(.milkdown span.purple-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.purple-5) { color: #6b21a8; }
.admin-wysiwyg-site :deep(.milkdown span.pink-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.pink-1) { color: #fbcfe8; }
.admin-wysiwyg-site :deep(.milkdown span.pink-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.pink-2) { color: #f472b6; }
.admin-wysiwyg-site :deep(.milkdown span.pink-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.pink-3) { color: #ec4899; }
.admin-wysiwyg-site :deep(.milkdown span.pink-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.pink-4) { color: #db2777; }
.admin-wysiwyg-site :deep(.milkdown span.pink-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.pink-5) { color: #be185d; }
.admin-wysiwyg-site :deep(.milkdown span.grey-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.grey-1) { color: #e5e7eb; }
.admin-wysiwyg-site :deep(.milkdown span.grey-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.grey-2) { color: #9ca3af; }
.admin-wysiwyg-site :deep(.milkdown span.grey-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.grey-3) { color: #6b7280; }
.admin-wysiwyg-site :deep(.milkdown span.grey-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.grey-4) { color: #4b5563; }
.admin-wysiwyg-site :deep(.milkdown span.grey-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.grey-5) { color: #374151; }
/* Backward compatibility: old class names map to mid/dark shades */
.admin-wysiwyg-site :deep(.milkdown span.red), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.red) { color: #dc2626; }
.admin-wysiwyg-site :deep(.milkdown span.red-dark), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.red-dark) { color: #7f1d1d; }
.admin-wysiwyg-site :deep(.milkdown span.orange), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.orange) { color: #ea580c; }
.admin-wysiwyg-site :deep(.milkdown span.orange-dark), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.orange-dark) { color: #9a3412; }
.admin-wysiwyg-site :deep(.milkdown span.green), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.green) { color: #22c55e; }
.admin-wysiwyg-site :deep(.milkdown span.green-dark), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.green-dark) { color: #15803d; }
.admin-wysiwyg-site :deep(.milkdown span.blue), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.blue) { color: #2563eb; }
.admin-wysiwyg-site :deep(.milkdown span.blue-dark), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.blue-dark) { color: #1e3a8a; }
.admin-wysiwyg-site :deep(.milkdown span.purple), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.purple) { color: #a855f7; }
.admin-wysiwyg-site :deep(.milkdown span.purple-dark), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.purple-dark) { color: #6b21a8; }
.admin-wysiwyg-site :deep(.milkdown span.gray), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.gray) { color: #6b7280; }
.admin-wysiwyg-site :deep(.milkdown span.gray-dark), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.gray-dark) { color: #374151; }
/* Underline and highlight [text]{.underline} / [text]{.highlight} */
.admin-wysiwyg-site :deep(.milkdown span.underline), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.underline) { text-decoration: underline; text-underline-offset: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.highlight), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.highlight) { background-color: #fef08a; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
/* Font background [text]{.bg-hue-n} — text colour by background luminance for readability */
.admin-wysiwyg-site :deep(.milkdown span.bg-red-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-red-1) { background-color: #fecaca; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-red-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-red-2) { background-color: #f87171; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-red-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-red-3) { background-color: #dc2626; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-red-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-red-4) { background-color: #b91c1c; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-red-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-red-5) { background-color: #7f1d1d; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-orange-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-orange-1) { background-color: #fed7aa; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-orange-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-orange-2) { background-color: #fb923c; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-orange-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-orange-3) { background-color: #ea580c; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-orange-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-orange-4) { background-color: #c2410c; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-orange-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-orange-5) { background-color: #9a3412; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-yellow-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-yellow-1) { background-color: #fef08a; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-yellow-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-yellow-2) { background-color: #facc15; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-yellow-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-yellow-3) { background-color: #eab308; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-yellow-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-yellow-4) { background-color: #ca8a04; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-yellow-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-yellow-5) { background-color: #a16207; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-green-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-green-1) { background-color: #bbf7d0; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-green-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-green-2) { background-color: #4ade80; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-green-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-green-3) { background-color: #22c55e; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-green-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-green-4) { background-color: #16a34a; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-green-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-green-5) { background-color: #15803d; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-teal-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-teal-1) { background-color: #99f6e4; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-teal-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-teal-2) { background-color: #2dd4bf; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-teal-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-teal-3) { background-color: #14b8a6; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-teal-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-teal-4) { background-color: #0d9488; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-teal-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-teal-5) { background-color: #0f766e; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-blue-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-blue-1) { background-color: #bfdbfe; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-blue-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-blue-2) { background-color: #60a5fa; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-blue-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-blue-3) { background-color: #2563eb; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-blue-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-blue-4) { background-color: #1d4ed8; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-blue-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-blue-5) { background-color: #1e3a8a; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-purple-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-purple-1) { background-color: #e9d5ff; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-purple-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-purple-2) { background-color: #c084fc; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-purple-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-purple-3) { background-color: #a855f7; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-purple-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-purple-4) { background-color: #7c3aed; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-purple-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-purple-5) { background-color: #6b21a8; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-pink-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-pink-1) { background-color: #fbcfe8; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-pink-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-pink-2) { background-color: #f472b6; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-pink-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-pink-3) { background-color: #ec4899; color: #fff; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-pink-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-pink-4) { background-color: #db2777; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-pink-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-pink-5) { background-color: #be185d; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-grey-1), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-grey-1) { background-color: #e5e7eb; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-grey-2), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-grey-2) { background-color: #9ca3af; color: #1a1a1a; padding: 0 0.15em; border-radius: 2px; }
.admin-wysiwyg-site :deep(.milkdown span.bg-grey-3), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-grey-3) { background-color: #6b7280; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-grey-4), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-grey-4) { background-color: #4b5563; padding: 0 0.15em; border-radius: 2px; color: #fff; }
.admin-wysiwyg-site :deep(.milkdown span.bg-grey-5), .admin-wysiwyg-site :deep(.milkdown .ProseMirror span.bg-grey-5) { background-color: #374151; padding: 0 0.15em; border-radius: 2px; color: #fff; }
/* Editor tables: match blog .post-content table styling */
.admin-wysiwyg-site :deep(.milkdown .milkdown-table-block),
.admin-wysiwyg-site :deep(.milkdown-table-block) {
  width: 100%;
  margin: 1.25rem 0 1.5rem;
  font-size: 0.95rem;
  box-shadow: var(--shadow-sm);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
}
.admin-wysiwyg-site :deep(.milkdown .milkdown-table-block table),
.admin-wysiwyg-site :deep(.milkdown-table-block table) {
  width: 100%;
  border-collapse: collapse;
}
.admin-wysiwyg-site :deep(.milkdown .milkdown-table-block thead),
.admin-wysiwyg-site :deep(.milkdown-table-block thead) {
  background: var(--color-bg-tertiary);
}
.admin-wysiwyg-site :deep(.milkdown .milkdown-table-block th),
.admin-wysiwyg-site :deep(.milkdown-table-block th) {
  padding: 0.65rem 0.75rem;
  text-align: center;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: inherit;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-border-medium);
}
.admin-wysiwyg-site :deep(.milkdown .milkdown-table-block td),
.admin-wysiwyg-site :deep(.milkdown-table-block td) {
  padding: 0.6rem 0.75rem;
  text-align: center;
  font-family: var(--font-body);
  font-size: inherit;
  border-bottom: 1px solid var(--color-border-light);
}
.admin-wysiwyg-site :deep(.milkdown .milkdown-table-block tbody tr:last-child td),
.admin-wysiwyg-site :deep(.milkdown-table-block tbody tr:last-child td) {
  border-bottom: none;
}
.admin-wysiwyg-site :deep(.milkdown .milkdown-table-block tbody tr:hover),
.admin-wysiwyg-site :deep(.milkdown-table-block tbody tr:hover) {
  background: var(--color-bg-secondary);
}
html.dark .admin-wysiwyg-site :deep(.milkdown .milkdown-table-block thead),
html.dark .admin-wysiwyg-site :deep(.milkdown-table-block thead) {
  background: color-mix(in srgb, var(--color-bg-tertiary) 80%, transparent);
}
</style>
