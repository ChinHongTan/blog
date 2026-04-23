<template>
	<div class="admin-editor-page">
		<!-- 狀態：儲存中… / 已儲存至本機 / 已同步。按鈕：儲存草稿、取消發布（僅已發布）、發布變更。 -->
		<ClientOnly>
			<Teleport to="#admin-editor-nav-actions">
				<span
					class="admin-status-dot-wrap"
					:class="editorStatusClass"
					:title="editorStatusLabel"
					aria-label="儲存狀態"
				>
					<Icon
						v-if="saveStatus === 'loading' || saveStatus === 'typing'"
						name="heroicons:arrow-path"
						size="12"
						class="admin-status-spinner"
					/>
					<span v-else class="admin-status-dot" />
				</span>
				<template v-if="docType === 'post'">
					<button
						v-if="!isPublishedPost"
						type="button"
						class="admin-btn admin-btn-ghost"
						:disabled="
							savingDraft ||
							saving ||
							!canEditPost ||
							!isPostTitleValidForSave
						"
						:title="postTitleValidationMessage"
						@click="saveDraftToGitHub"
					>
						{{ savingDraft ? "儲存中…" : "儲存草稿" }}
					</button>
					<button
						v-if="isPublishedPost"
						type="button"
						class="admin-btn admin-btn-ghost"
						:disabled="saving || unpublishing || !canEditPost"
						@click="unpublish"
					>
						{{ unpublishing ? "處理中…" : "取消發布" }}
					</button>
					<button
						v-if="showDeleteDraftButton"
						type="button"
						class="admin-btn admin-btn-ghost"
						:disabled="deletingDraft || !canEditPost"
						@click="openDeleteDraftConfirm"
					>
						刪除草稿
					</button>
					<button
						v-if="pathQuery"
						type="button"
						class="admin-btn admin-btn-ghost"
						:disabled="
							saving ||
							savingDraft ||
							unpublishing ||
							deletingDraft ||
							revertingToGitHub ||
							!canEditPost
						"
						@click="openRevertToGitHubConfirm"
					>
						還原 GitHub 版本
					</button>
					<button
						type="button"
						class="admin-btn admin-btn-primary"
						:disabled="
							saving ||
							!canEditPost ||
							!isPostTitleValidForSave ||
							(isPublishedPost && !hasUnsavedChanges)
						"
						:title="
							!canEditPost
								? '您只能編輯自己的文章'
								: postTitleValidationMessage
						"
						@click="publish"
					>
						{{ saving ? "正在同步至 GitHub…" : publishButtonLabel }}
					</button>
				</template>
				<template v-else>
					<button
						type="button"
						class="admin-btn admin-btn-primary"
						:disabled="saving || !canEditPost"
						@click="publish"
					>
						{{ saving ? "儲存中…" : "儲存" }}
					</button>
				</template>
			</Teleport>
		</ClientOnly>

		<!-- Fixed toolbar in top nav (middle): icons + hover dropdowns. Only in WYSIWYG when editor ready. -->
		<ClientOnly>
			<Teleport to="#admin-editor-toolbar">
				<template v-if="showFixedToolbar">
					<AdminEditorToolbar :api="milkdownRef" />
				</template>
			</Teleport>
		</ClientOnly>

		<div
			v-if="docType === 'post' && !canEditPost && pathQuery"
			class="admin-editor-readonly-hint"
		>
			此文章作者 ID 為「{{ meta.author }}」，您只能檢視；儲存按鈕已停用。
		</div>
		<div
			v-else-if="docType === 'post' && isPublishedPost"
			class="admin-editor-published-hint"
		>
			已發布文章可直接編輯，變更會先存於本機；點擊「發布變更」同步至
			GitHub。
		</div>
		<div class="admin-editor-body">
			<!-- Post: inline title, Obsidian-style properties, featured image, then editor -->
			<template v-if="docType === 'post'">
				<!-- Inline title -->
				<div class="admin-inline-title-wrap">
					<input
						v-model="meta.title"
						type="text"
						class="admin-inline-title"
						placeholder="文章標題…"
					>
					<small
						v-if="!isPostTitleValidForSave"
						class="admin-inline-title-warning"
					>
						請填寫標題（不可為空或 untitled）
					</small>
				</div>

				<!-- Properties: Obsidian-style with icons -->
				<div class="admin-properties-top">
					<div class="admin-properties-header">
						<button
							type="button"
							class="admin-properties-toggle"
							:aria-expanded="propertiesOpen"
							@click="propertiesOpen = !propertiesOpen"
						>
							<Icon
								:name="
									propertiesOpen
										? 'heroicons:chevron-down'
										: 'heroicons:chevron-right'
								"
								size="18"
							/>
							<span>屬性</span>
						</button>
						<div class="admin-header-mode-toggle">
							<button
								type="button"
								class="admin-mode-btn"
								:class="{ active: viewMode === 'wysiwyg' }"
								@click="viewMode = 'wysiwyg'"
							>
								編輯
							</button>
							<button
								type="button"
								class="admin-mode-btn"
								:class="{ active: viewMode === 'raw' }"
								@click="viewMode = 'raw'"
							>
								Markdown
							</button>
						</div>
					</div>
					<Transition name="properties-panel">
						<div
							v-show="propertiesOpen"
							class="admin-properties-table-wrap"
						>
							<div class="admin-properties-table">
								<div class="admin-property-tr">
									<span class="admin-property-name">
										<Icon name="heroicons:document-text" size="14" class="admin-property-icon" />
										簡述
									</span>
									<input
										v-model="meta.description"
										type="text"
										class="admin-property-cell"
										placeholder="輸入簡述…"
									>
								</div>
								<div
									class="admin-property-tr admin-property-tr-tags"
								>
									<span class="admin-property-name">
										<Icon name="heroicons:tag" size="14" class="admin-property-icon" />
										標籤
									</span>
									<div
										class="admin-property-cell admin-property-tags-wrap"
										@click="focusTagInput"
									>
										<template
											v-for="t in meta.tags"
											:key="t"
										>
											<span class="admin-meta-chip">
												{{ t }}
												<button
													type="button"
													class="admin-meta-chip-remove"
													aria-label="移除"
													@click.stop="removeTag(t)"
												>
													×
												</button>
											</span>
										</template>
										<input
											ref="tagInputRef"
											v-model="tagInputValue"
											type="text"
											class="admin-property-tag-input"
											placeholder="新增標籤…"
											@keydown.enter.prevent="addTag"
											@focus="onTagInputFocus"
											@blur="onTagInputBlur"
										>
										<div
											v-if="
												showTagSuggestions &&
												(tagSuggestions.length > 0 ||
													canCreateNewTag)
											"
											class="admin-series-suggestions"
										>
											<button
												v-for="t in tagSuggestions"
												:key="t"
												type="button"
												class="admin-series-suggestion"
												@mousedown.prevent="
													selectTag(t)
												"
											>
												{{ t }}
											</button>
											<button
												v-if="canCreateNewTag"
												type="button"
												class="admin-series-suggestion admin-series-suggestion-new"
												@mousedown.prevent="addTag"
											>
												{{ tagInputValue }}
												<span
													class="admin-series-new-badge"
													>新標籤</span
												>
											</button>
										</div>
									</div>
								</div>
								<!-- 更多選項 -->
								<div class="admin-property-tr admin-property-tr-more">
									<button
										type="button"
										class="admin-more-toggle"
										@click="moreOptionsOpen = !moreOptionsOpen"
									>
										<Icon
											:name="moreOptionsOpen ? 'heroicons:chevron-down' : 'heroicons:chevron-right'"
											size="14"
											class="admin-property-icon"
										/>
										更多選項
									</button>
								</div>
								<template v-if="moreOptionsOpen">
									<div
										class="admin-property-tr admin-property-tr-pinned"
									>
										<span class="admin-property-name">
											<Icon name="heroicons:bookmark" size="14" class="admin-property-icon" />
											置頂
										</span>
										<div class="admin-property-field">
											<label class="admin-toggle-switch">
												<input
													v-model="meta.pinned"
													type="checkbox"
													:disabled="!canEditPost"
													aria-label="置頂"
												>
												<span class="admin-toggle-track">
													<span class="admin-toggle-thumb" />
												</span>
											</label>
										</div>
									</div>
									<div
										v-if="meta.edited_at"
										class="admin-property-tr"
									>
										<span class="admin-property-name">
											<Icon name="heroicons:clock" size="14" class="admin-property-icon" />
											最後編輯
										</span>
										<span
											class="admin-property-cell admin-property-readonly"
											>{{
												formatEditedAt(meta.edited_at)
											}}</span
										>
									</div>
								</template>
							</div>
						</div>
					</Transition>
				</div>

				<!-- Featured image: drop zone + upload or paste URL. No media library. -->
				<div
					class="admin-hero-slot admin-hero-upload"
					:class="{
						empty: !meta.featured_image,
						'admin-hero-uploading': featuredUploading,
					}"
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
						<img
							:src="featuredImagePreviewUrl"
							:alt="meta.title || '精選圖片'"
							loading="lazy"
							decoding="async"
						>
						<div class="admin-hero-title-wrap">
							<h2 class="admin-hero-title">
								{{ meta.title || "未命名" }}
							</h2>
						</div>
						<div class="admin-hero-replace-hint">
							點擊或拖曳替換
						</div>
					</template>
					<template v-else>
						<span class="admin-hero-empty-label"
							>拖曳圖片到這裡，或點擊上傳</span
						>
						<span
							v-if="featuredUploading"
							class="admin-hero-uploading-label"
							>上傳中…</span
						>
					</template>
				</div>

				<!-- Editor full width -->
				<div class="admin-editor-main">
					<div class="admin-wysiwyg-site">
						<div
							v-show="viewMode === 'wysiwyg'"
							class="admin-editor-wysiwyg"
						>
							<ClientOnly>
								<AdminMilkdownEditor
									v-if="contentReady"
									:key="`editor-${pathQuery || slug || 'new'}-${editorMountKey}`"
									ref="milkdownRef"
									:default-value="body"
									@ready="onEditorReady"
									@markdown-change="onMilkdownMarkdownChange"
								/>
								<div v-else class="admin-editor-loading">
									載入內容…
								</div>
							</ClientOnly>
						</div>
						<div
							v-show="viewMode === 'raw'"
							class="admin-editor-raw"
						>
							<textarea
								v-model="rawBody"
								class="admin-textarea"
								spellcheck="false"
								placeholder="Markdown 內容…"
							/>
						</div>
						
					</div>
				</div>
			</template>

			<!-- Author: mode toggle + meta + editor -->
			<template v-else-if="docType === 'author'">
				<div class="admin-properties-header" style="padding-left: 120px; margin-bottom: 0.5rem;">
					<div class="admin-header-mode-toggle">
						<button
							type="button"
							class="admin-mode-btn"
							:class="{ active: viewMode === 'wysiwyg' }"
							@click="viewMode = 'wysiwyg'"
						>
							編輯
						</button>
						<button
							type="button"
							class="admin-mode-btn"
							:class="{ active: viewMode === 'raw' }"
							@click="viewMode = 'raw'"
						>
							Markdown
						</button>
					</div>
				</div>
				<div class="admin-editor-meta-wrap">
					<div class="admin-editor-meta">
						<div class="admin-form-row">
							<label>名稱</label>
							<input
								v-model="meta.name"
								type="text"
								class="admin-input"
								placeholder="顯示名稱"
							>
						</div>
						<div class="admin-form-row">
							<label>簡介</label>
							<input
								v-model="meta.bio"
								type="text"
								class="admin-input"
								placeholder="一行簡介"
							>
						</div>
						<div class="admin-form-row">
							<label>頭像</label>
							<div class="admin-input-group admin-upload-row">
								<input
									v-model="meta.avatar"
									type="text"
									class="admin-input"
									placeholder="/images/uploads/avatar.png"
								>
								<input
									ref="authorAvatarFileInput"
									type="file"
									accept="image/*"
									class="admin-upload-hidden"
									@change="onAuthorAvatarFileChange"
								>
								<button
									type="button"
									class="admin-btn admin-btn-sm"
									:disabled="avatarUploading"
									@click="authorAvatarFileInput?.click()"
								>
									{{ avatarUploading ? "上傳中…" : "上傳" }}
								</button>
							</div>
						</div>
						<div class="admin-form-row">
							<label>橫幅</label>
							<div class="admin-input-group admin-upload-row">
								<input
									v-model="meta.banner"
									type="text"
									class="admin-input"
									placeholder="/images/uploads/banner.jpg"
								>
								<input
									ref="authorBannerFileInput"
									type="file"
									accept="image/*"
									class="admin-upload-hidden"
									@change="onAuthorBannerFileChange"
								>
								<button
									type="button"
									class="admin-btn admin-btn-sm"
									:disabled="bannerUploading"
									@click="authorBannerFileInput?.click()"
								>
									{{ bannerUploading ? "上傳中…" : "上傳" }}
								</button>
							</div>
						</div>
						<div class="admin-form-row">
							<label>GitHub</label>
							<input
								v-model="meta.github"
								type="url"
								class="admin-input"
								placeholder="https://github.com/..."
							>
						</div>
						<div class="admin-form-row">
							<label>網站</label>
							<input
								v-model="meta.website"
								type="url"
								class="admin-input"
								placeholder="https://..."
							>
						</div>
					</div>
					<div class="admin-wysiwyg-site admin-editor-main">
						<div
							v-show="viewMode === 'wysiwyg'"
							class="admin-editor-wysiwyg"
						>
							<ClientOnly>
								<AdminMilkdownEditor
									v-if="contentReady"
									:key="`editor-${pathQuery || slug || 'new'}-${editorMountKey}`"
									ref="milkdownRef"
									:default-value="body"
									@ready="onEditorReady"
									@markdown-change="onMilkdownMarkdownChange"
								/>
								<div v-else class="admin-editor-loading">
									載入內容…
								</div>
							</ClientOnly>
						</div>
						<div
							v-show="viewMode === 'raw'"
							class="admin-editor-raw"
						>
							<textarea
								v-model="rawBody"
								class="admin-textarea"
								spellcheck="false"
								placeholder="Markdown 內容…"
							/>
						</div>
						
					</div>
				</div>
			</template>
		</div>

		<!-- Hidden mirror used to measure raw-textarea height without collapsing the textarea. -->
		<div
			ref="rawMirrorRef"
			class="admin-textarea admin-textarea-mirror"
			aria-hidden="true"
		/>

		<!-- 本機較新版本恢復列：僅在 content/drafts/ 且 local savedAt > server 時顯示 -->
		<div v-if="showRecoveryBar" class="admin-recovery-bar">
			<span class="admin-recovery-text"
				>我們在此裝置上發現較新的未儲存版本。</span
			>
			<div class="admin-recovery-actions">
				<button
					type="button"
					class="admin-btn admin-btn-primary admin-btn-sm"
					@click="restoreLocalVersion"
				>
					還原本機版本
				</button>
				<button
					type="button"
					class="admin-btn admin-btn-ghost admin-btn-sm"
					@click="discardLocalVersion"
				>
					捨棄本機變更
				</button>
			</div>
		</div>

		<!-- 已發布/草稿 + 本機有版本：選擇使用 GitHub 版本或本機版本 -->
		<BaseModal
			:model-value="showVersionChoiceModal"
			title="選擇版本"
			:description="
				versionChoiceIsDraft
					? '此草稿在 GitHub 與本機都有版本。要使用哪一個？'
					: '此文章在 GitHub 已發布，且本機有未同步的版本。要使用哪一個？'
			"
			width="md"
			role="alertdialog"
			@update:model-value="onVersionChoiceModalVisibilityChange"
		>
			<div
				v-if="versionChoiceDiffSummary"
				class="version-choice-details"
			>
				<div class="version-choice-timestamps">
					<div class="version-choice-row">
						<span class="version-choice-label">GitHub 版本</span>
						<span class="version-choice-time">{{
							versionChoiceServerModified
								? new Date(versionChoiceServerModified).toLocaleString()
								: '未知'
						}}</span>
					</div>
					<div class="version-choice-row">
						<span class="version-choice-label">本機版本</span>
						<span class="version-choice-time">{{
							versionChoiceLocalSavedAt
								? new Date(versionChoiceLocalSavedAt).toLocaleString()
								: '未知'
						}}</span>
					</div>
				</div>
				<ul class="version-choice-diff-list">
					<li v-if="versionChoiceDiffSummary.titleChanged">
						標題不同：「{{ versionChoiceDiffSummary.serverTitle || '(無)' }}」→「{{ versionChoiceDiffSummary.localTitle || '(無)' }}」
					</li>
					<li v-if="!versionChoiceDiffSummary.bodyIdentical">
						內文不同（GitHub {{ versionChoiceDiffSummary.serverWordCount }} 字 / 本機 {{ versionChoiceDiffSummary.localWordCount }} 字）
					</li>
					<li v-if="!versionChoiceDiffSummary.metaIdentical && !versionChoiceDiffSummary.titleChanged">
						標籤或分類等設定不同
					</li>
					<li
						v-if="
							versionChoiceDiffSummary.bodyIdentical &&
							versionChoiceDiffSummary.metaIdentical
						"
					>
						內容相同（僅格式差異）
					</li>
				</ul>
			</div>
			<template #actions>
				<button
					type="button"
					class="ui-btn ui-btn-primary"
					@click="useGitHubVersion"
				>
					使用 GitHub 上的版本
				</button>
				<button
					type="button"
					class="ui-btn ui-btn-ghost"
					@click="useLocalVersion"
				>
					使用本機版本
				</button>
			</template>
		</BaseModal>

		<!-- 刪除草稿確認（點擊背景不關閉，改為晃動提示） -->
		<BaseModal
			:model-value="showDeleteDraftConfirm"
			title="刪除草稿"
			description="確定要刪除此草稿嗎？此操作無法復原。"
			variant="danger"
			role="alertdialog"
			:close-on-backdrop="false"
			:close-on-esc="false"
			:panel-class="deleteModalShake ? 'admin-confirm-modal-shake' : ''"
			@update:model-value="onDeleteDraftModalVisibilityChange"
			@overlay-click="onDeleteConfirmOverlayClick"
		>
			<template #actions>
				<button
					type="button"
					class="ui-btn ui-btn-ghost"
					@click="showDeleteDraftConfirm = false"
				>
					取消
				</button>
				<button
					type="button"
					class="ui-btn ui-btn-danger"
					@click="confirmDeleteDraft"
				>
					刪除
				</button>
			</template>
		</BaseModal>

		<ClientOnly>
			<ImageCropperModal
				v-model="showCropper"
				:file="cropperFile"
				@confirm="onCropperConfirm"
				@cancel="onCropperCancel"
			/>
		</ClientOnly>

		<BaseModal
			:model-value="showRevertToGitHubConfirm"
			title="還原 GitHub 版本"
			description="確定要放棄目前編輯器中的本機變更，並回到 GitHub 上的版本嗎？此操作無法復原。"
			variant="danger"
			role="alertdialog"
			@update:model-value="onRevertToGitHubModalVisibilityChange"
		>
			<template #actions>
				<button
					type="button"
					class="ui-btn ui-btn-ghost"
					@click="showRevertToGitHubConfirm = false"
				>
					取消
				</button>
				<button
					type="button"
					class="ui-btn ui-btn-danger"
					:disabled="revertingToGitHub"
					@click="confirmRevertToGitHubVersion"
				>
					{{ revertingToGitHub ? "還原中…" : "還原" }}
				</button>
			</template>
		</BaseModal>
	</div>
</template>

<script setup lang="ts">
import type { EditorToolbarApi } from "~/components/admin/MilkdownEditorInner.vue";
import BaseModal from "~/components/ui/BaseModal.vue";
import { useAdminProfileMe } from "~/composables/useAdminProfileMe";

definePageMeta({ layout: "admin" });

const route = useRoute();
useAdminAuth();
const { fetchProfileMe } = useAdminProfileMe();
const toast = useToast();
const getApiErrorMessage = useApiErrorMessage();
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

// slugifyTitle, buildFrontmatter, parseFrontmatter are auto-imported from composables/useEditorFrontmatter

function getLocalDateTimeString(): string {
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	const tzOffsetMin = -now.getTimezoneOffset();
	const tzSign = tzOffsetMin >= 0 ? "+" : "-";
	const tzAbs = Math.abs(tzOffsetMin);
	const tzHour = pad(Math.floor(tzAbs / 60));
	const tzMin = pad(tzAbs % 60);
	return (
		`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
		`T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` +
		`${tzSign}${tzHour}:${tzMin}`
	);
}

const meta = reactive({
	title: "",
	description: "",
	date: "",
	edited_at: "",
	author: "",
	path: "",
	tags: [] as string[],
	featured_image: "",
	pinned: false,
	name: "",
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
		contentReady.value,
);
/** When true, rawBody was just set from Milkdown — skip pushing back to Milkdown in rawBody watcher. */
const rawBodyUpdateFromMilkdown = ref(false);
const saving = ref(false);
const propertiesOpen = ref(true);
const moreOptionsOpen = ref(false);
const { uploadImage, uploading: featuredUploading } = useUploadImage();
const { uploadImage: uploadImageAvatar, uploading: avatarUploading } =
	useUploadImage();
const { uploadImage: uploadImageBanner, uploading: bannerUploading } =
	useUploadImage();

const runtimeConfig = useRuntimeConfig();

function toPreviewUrl(path: string | undefined): string {
	if (!path) return "";
	if (path.startsWith("http://") || path.startsWith("https://")) return path;
	const repo = runtimeConfig.public.githubRepo as string;
	const branch = (runtimeConfig.public.githubBranch as string) || "main";
	return `https://raw.githubusercontent.com/${repo}/${branch}/public${path}`;
}

const featuredImagePreviewUrl = computed(() =>
	toPreviewUrl(meta.featured_image),
);
const _avatarPreviewUrl = computed(() => toPreviewUrl(meta.avatar));
const _bannerPreviewUrl = computed(() => toPreviewUrl(meta.banner));
const featuredFileInput = ref<HTMLInputElement | null>(null);
const authorAvatarFileInput = ref<HTMLInputElement | null>(null);
const authorBannerFileInput = ref<HTMLInputElement | null>(null);
const heroDragOver = ref(false);
const showCropper = ref(false);
const cropperFile = ref<File | null>(null);
const tagInputRef = ref<HTMLInputElement | null>(null);
const fileSha = ref<string | undefined>(undefined);
/** True after initial content load (or no file to load). Ensures Milkdown mounts with correct body. */
const contentReady = ref(false);

// Tags autocomplete state
const availableTags = ref<string[]>([]);
const tagInputValue = ref("");
const showTagSuggestions = ref(false);
const tagSuggestions = computed(() => {
	const query = tagInputValue.value.toLowerCase().trim();
	if (!query)
		return availableTags.value.filter((t) => !meta.tags.includes(t));
	return availableTags.value.filter(
		(t) => t.toLowerCase().includes(query) && !meta.tags.includes(t),
	);
});
const canCreateNewTag = computed(() => {
	const query = tagInputValue.value.trim();
	if (!query) return false;
	const lowerQuery = query.toLowerCase();
	return (
		!availableTags.value.some((t) => t.toLowerCase() === lowerQuery) &&
		!meta.tags.includes(query)
	);
});

async function fetchAvailableTags() {
	try {
		const result = await $fetch<{
			posts: unknown[];
			tags: string[];
		}>("/api/admin/posts-index", { query: { t: Date.now() } });
		availableTags.value = result.tags ?? [];
	} catch {
		availableTags.value = [];
	}
}

function focusTagInput() {
	tagInputRef.value?.focus();
}
function formatEditedAt(iso: string): string {
	try {
		return new Date(iso).toLocaleString("zh-TW", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

function addTag() {
	const v = tagInputValue.value.trim();
	if (v && !meta.tags.includes(v)) {
		meta.tags.push(v);
		// Add to available tags if it's new
		if (!availableTags.value.includes(v)) {
			availableTags.value.push(v);
			availableTags.value.sort();
		}
	}
	tagInputValue.value = "";
	showTagSuggestions.value = false;
}
function selectTag(t: string) {
	if (!meta.tags.includes(t)) {
		meta.tags.push(t);
	}
	tagInputValue.value = "";
	showTagSuggestions.value = false;
}
function onTagInputFocus() {
	showTagSuggestions.value = true;
}
function onTagInputBlur() {
	setTimeout(() => {
		showTagSuggestions.value = false;
	}, 150);
}
function removeTag(t: string) {
	meta.tags = meta.tags.filter((x) => x !== t);
}

function syncTitleFromFirstH1() {
	const md = getBodyContent();
	const m = md.match(/^#\s+(.+)$/m);
	if (m) meta.title = m[1].trim();
}

const isPostTitleValidForSave = computed(
	() => docType.value !== "post" || slugifyTitle(meta.title) !== "untitled",
);
const postTitleValidationMessage = computed(() => {
	if (docType.value !== "post") return "";
	if (!canEditPost.value) return "";
	return isPostTitleValidForSave.value
		? ""
		: "請先填寫標題（不可為空或 untitled）";
});

function ensurePostTitleForSave(): boolean {
	if (docType.value !== "post") return true;
	if (!meta.title) syncTitleFromFirstH1();
	const stem = slugifyTitle(meta.title);
	if (stem === "untitled") {
		toast.error("請先填寫文章標題，再儲存或發布。");
		return false;
	}
	return true;
}

const _previewSource = computed(() =>
	viewMode.value === "raw"
		? rawBody.value
		: (milkdownRef.value?.getMarkdown?.() ??
			getMarkdownRef.value?.() ??
			rawBody.value),
);

const filePath = computed(() => {
	if (pathQuery.value) return pathQuery.value;
	if (docType.value === "post")
		return slug.value ? `content/blog/${slug.value}.md` : "";
	if (docType.value === "author")
		return slug.value ? `content/authors/${slug.value}.md` : "";
	return "";
});

/** 目前編輯的是已發布文章（路徑在 content/blog/）。不依賴 fileSha，避免載入前誤判。 */
const isPublishedPost = computed(
	() =>
		docType.value === "post" &&
		!!pathQuery.value &&
		pathQuery.value.startsWith("content/blog/"),
);

/** 文章目前在 GitHub 的 content/drafts/（草稿）。 */
const isDraftOnGitHub = computed(
	() =>
		docType.value === "post" &&
		!!pathQuery.value &&
		pathQuery.value.startsWith("content/drafts/"),
);

/** 顯示「刪除草稿」按鈕：目前為草稿（未發布）且為文章。 */
const showDeleteDraftButton = computed(
	() => docType.value === "post" && !isPublishedPost.value,
);

const draftKey = computed(
	() =>
		`admin-draft-${docType.value}-${pathQuery.value || slug.value || "new"}`,
);

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
const showRevertToGitHubConfirm = ref(false);
const revertingToGitHub = ref(false);
/** Shake delete modal when user clicks backdrop (destructive action — must choose). */
const deleteModalShake = ref(false);
let deleteModalShakeTimeout: ReturnType<typeof setTimeout> | null = null;

function onDeleteConfirmOverlayClick() {
	deleteModalShake.value = true;
	if (deleteModalShakeTimeout) clearTimeout(deleteModalShakeTimeout);
	deleteModalShakeTimeout = setTimeout(() => {
		deleteModalShake.value = false;
		deleteModalShakeTimeout = null;
	}, 500);
}

function onVersionChoiceModalVisibilityChange(next: boolean) {
	if (next) {
		showVersionChoiceModal.value = true;
		return;
	}
	if (showVersionChoiceModal.value) useGitHubVersion();
}

function onDeleteDraftModalVisibilityChange(next: boolean) {
	showDeleteDraftConfirm.value = next;
}
const showRecoveryBar = ref(false);
/** 已發布文章或 GitHub 草稿 + 本機有版本時，詢問使用 GitHub 版本或本機版本。 */
const showVersionChoiceModal = ref(false);
/** 版本選擇情境為「GitHub 草稿 vs 本機草稿」（true）或「已發布 vs 本機」（false）。 */
const versionChoiceIsDraft = computed(
	() => !!pathQuery.value?.startsWith("content/drafts/"),
);
/** 為 true 時不寫入 localStorage，避免載入 API 後觸發 watcher 覆蓋本機草稿。 */
const versionChoicePending = ref(false);
/** 載入時若本機較新，存 server 的 lastModified 供恢復列比較。 */
const serverLastModified = ref<string | null>(null);
/** 選擇「使用本機版本」時遞增，強制編輯器重新掛載以讀取 body。 */
const editorMountKey = ref(0);
let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;
/** 載入遠端內容時暫停 local autosave，避免初次賦值被誤判成使用者輸入。 */
const isHydratingFromRemote = ref(false);
/** 用於比較「目前編輯器內容是否等於 GitHub 版本」。等於時可清除本機草稿。 */
const serverBaselineSnapshot = ref<string | null>(null);
/** 版本選擇 modal 用：本機草稿的儲存時間 & GitHub 版本的最後修改時間。 */
const versionChoiceLocalSavedAt = ref<number | null>(null);
const versionChoiceServerModified = ref<string | null>(null);
/** 版本選擇 modal 用：兩個版本的摘要差異資訊。 */
const versionChoiceDiffSummary = ref<{
	titleChanged: boolean;
	localTitle: string;
	serverTitle: string;
	localWordCount: number;
	serverWordCount: number;
	bodyIdentical: boolean;
	metaIdentical: boolean;
} | null>(null);

function currentSnapshot(): string {
	return serializeMeta() + "\n" + normalizeBodyForCompare(getBodyContent());
}

function clearLocalDraftKey(key = draftKey.value) {
	try {
		localStorage.removeItem(key);
	} catch {
		/* ignore */
	}
}

function serializeMeta(): string {
	const metaCopy = {
		...meta,
		tags: [...meta.tags],
	};
	return JSON.stringify(metaCopy);
}

function normalizeBodyForCompare(s: string): string {
	return (s || "").replace(/\r\n/g, "\n").trim();
}

function countWords(s: string): number {
	const text = (s || "").trim();
	if (!text) return 0;
	// Count CJK characters individually + whitespace-separated tokens for Latin
	const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
	const latin = text
		.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length > 0);
	return (cjk?.length ?? 0) + latin.length;
}

/** 比較 localStorage 草稿與已載入的 server 版本，產生差異摘要。若完全相同則自動關閉 modal。 */
function computeVersionChoiceDiff(rawDraft: string): boolean {
	try {
		const draft = JSON.parse(rawDraft);
		const localMeta = draft.meta || {};
		const localBody = normalizeBodyForCompare(draft.body ?? "");
		const serverBody = normalizeBodyForCompare(rawBody.value);
		const localTitle = (localMeta.title ?? "").trim();
		const serverTitle = (meta.title ?? "").trim();

		const bodyIdentical = localBody === serverBody;
		const metaIdentical =
			localTitle === serverTitle &&
			JSON.stringify(localMeta.tags ?? []) ===
				JSON.stringify(meta.tags ?? []) &&
			(localMeta.description ?? "").trim() ===
				(meta.description ?? "").trim();

		if (bodyIdentical && metaIdentical) {
			// Versions are identical — auto-dismiss, no need to ask
			return true;
		}

		versionChoiceLocalSavedAt.value =
			typeof draft.savedAt === "number" ? draft.savedAt : null;
		versionChoiceServerModified.value = serverLastModified.value;
		versionChoiceDiffSummary.value = {
			titleChanged: localTitle !== serverTitle,
			localTitle,
			serverTitle,
			localWordCount: countWords(localBody),
			serverWordCount: countWords(serverBody),
			bodyIdentical,
			metaIdentical,
		};
		return false;
	} catch {
		return false;
	}
}

const hasUnsavedChanges = computed(() => {
	void bodyCheckTrigger.value; // poll body every 2s
	if (lastSavedMetaJson.value === null) return true; // new doc
	const bodyNow = normalizeBodyForCompare(getBodyContent());
	const bodySaved = normalizeBodyForCompare(lastSavedBody.value ?? "");
	return (
		cachedMetaJson.value !== lastSavedMetaJson.value ||
		bodyNow !== bodySaved
	);
});

/** 是否為已發布路徑（content/blog/）。此類文章不寫入 localStorage，且載入中顯示「載入中…」。 */
const isPublishedPath = computed(
	() =>
		docType.value === "post" &&
		!!pathQuery.value &&
		pathQuery.value.startsWith("content/blog/"),
);

/** 狀態：loading=載入中 / typing=儲存中… / saved=已儲存至本機 / synced=已同步。 */
const saveStatus = computed<
	"loading" | "typing" | "saved" | "synced" | "draft"
>(() => {
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
	if (saveStatus.value === "saved" && isPublishedPath.value)
		return "本機有未同步變更";
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

function buildFrontmatterStr(): string {
	return buildFrontmatter(docType.value, meta);
}

function getBodyContent(): string {
	if (viewMode.value === "raw") return rawBody.value;
	try {
		return (
			milkdownRef.value?.getMarkdown?.() ??
			getMarkdownRef.value?.() ??
			rawBody.value
		);
	} catch {
		// Milkdown may be remounting; fall back to raw markdown snapshot.
		return rawBody.value;
	}
}

function saveDraft() {
	if (versionChoicePending.value) return;
	if (docType.value === "post" && !canEditPost.value) return;
	const content = getBodyContent();
	const data = { meta: { ...meta }, body: content, savedAt: Date.now() };
	try {
		localStorage.setItem(draftKey.value, JSON.stringify(data));
		lastSavedToLocalSnapshot.value =
			serializeMeta() + "\n" + normalizeBodyForCompare(content);
		isDirty.value = false;
	} catch (e) {
		console.error(e);
	}
}

/** 有變更尚未寫入 localStorage 時排程 1s 後寫入。已發布文章也會寫入本機作為恢復用。非作者不自動儲存。 */
function scheduleDebouncedLocalSave() {
	if (versionChoicePending.value) return;
	if (isHydratingFromRemote.value) return;
	if (docType.value !== "post" && docType.value !== "author") return;
	if (docType.value === "post" && !canEditPost.value) return;
	const snapshot = currentSnapshot();
	if (
		serverBaselineSnapshot.value &&
		snapshot === serverBaselineSnapshot.value
	) {
		clearLocalDraftKey();
		lastSavedToLocalSnapshot.value = snapshot;
		isDirty.value = false;
		return;
	}
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
		if (typeof m === "object" && m !== null && "email" in m) {
			delete (m as Record<string, unknown>).email;
		}
		Object.keys(meta).forEach((k) => {
			if (k === "tags") {
				if (Array.isArray(m[k]))
					(meta as Record<string, unknown>)[k] = m[k];
				else if (typeof m.tagsText === "string")
					(meta as Record<string, unknown>).tags = m.tagsText
						.split(",")
						.map((s: string) => s.trim())
						.filter(Boolean);
			} else if (m[k] !== undefined)
				(meta as Record<string, unknown>)[k] = m[k];
		});
		body.value = data.body ?? "";
		rawBody.value = data.body ?? "";
		lastSavedToLocalSnapshot.value =
			serializeMeta() + "\n" + normalizeBodyForCompare(body.value);
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
	clearLocalDraftKey();
	showRecoveryBar.value = false;
	serverLastModified.value = null;
	lastSavedToLocalSnapshot.value = currentSnapshot();
}

/** 版本選擇：使用 GitHub 上的已發布版本（捨棄本機草稿）。 */
function useGitHubVersion() {
	versionChoicePending.value = false;
	clearLocalDraftKey();
	showVersionChoiceModal.value = false;
	versionChoiceDiffSummary.value = null;
	serverLastModified.value = null;
	lastSavedToLocalSnapshot.value = currentSnapshot();
	serverBaselineSnapshot.value = lastSavedToLocalSnapshot.value;
	contentReady.value = true;
	isHydratingFromRemote.value = true;
	nextTick(() => {
		setTimeout(() => {
			lastSavedBody.value = normalizeBodyForCompare(getBodyContent());
			const stableSnapshot = currentSnapshot();
			serverBaselineSnapshot.value = stableSnapshot;
			lastSavedToLocalSnapshot.value = stableSnapshot;
			clearLocalDraftKey();
			isHydratingFromRemote.value = false;
		}, 600);
	});
}

/** 版本選擇：使用本機版本（載入草稿）。先關閉編輯器、載入本機、再重新掛載以確保顯示本機內容。 */
function useLocalVersion() {
	versionChoicePending.value = false;
	showVersionChoiceModal.value = false;
	versionChoiceDiffSummary.value = null;
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
					lastSavedBody.value =
						normalizeBodyForCompare(getBodyContent());
				}, 600);
			});
		});
	});
}

function openRevertToGitHubConfirm() {
	if (!pathQuery.value || !canEditPost.value) return;
	showRevertToGitHubConfirm.value = true;
}

function onRevertToGitHubModalVisibilityChange(next: boolean) {
	showRevertToGitHubConfirm.value = next;
}

async function confirmRevertToGitHubVersion() {
	if (!pathQuery.value) return;
	revertingToGitHub.value = true;
	showRevertToGitHubConfirm.value = false;
	isHydratingFromRemote.value = true;
	showRecoveryBar.value = false;
	versionChoicePending.value = false;
	clearLocalDraftKey();
	if (debounceSaveTimer) {
		clearTimeout(debounceSaveTimer);
		debounceSaveTimer = null;
	}
	isDirty.value = false;
	contentReady.value = false;
	try {
		await loadFromApi();
	} finally {
		contentReady.value = true;
		isHydratingFromRemote.value = false;
		revertingToGitHub.value = false;
	}
}

function loadFromApi(): Promise<void> {
	isHydratingFromRemote.value = true;
	if (debounceSaveTimer) {
		clearTimeout(debounceSaveTimer);
		debounceSaveTimer = null;
	}
	isDirty.value = false;
	if (!filePath.value) {
		serverBaselineSnapshot.value = null;
		if (docType.value === "post") {
			meta.date = getLocalDateTimeString();
		}
		loadDraft();
		nextTick(() => {
			cachedMetaJson.value = serializeMeta();
		});
		contentReady.value = true;
		isHydratingFromRemote.value = false;
		return Promise.resolve();
	}
	return $fetch<{ content: string; sha?: string; lastModified?: string }>(
		`/api/admin/repo/files?path=${encodeURIComponent(filePath.value)}`,
	)
		.then((res) => {
			fileSha.value = res.sha;
			serverLastModified.value = res.lastModified ?? null;
			const raw = res.content || "";
			const rawDraftForChoice =
				typeof localStorage !== "undefined"
					? localStorage.getItem(draftKey.value)
					: null;
			const willShowVersionChoice = !!(
				rawDraftForChoice &&
				docType.value === "post" &&
				(pathQuery.value?.startsWith("content/blog/") ||
					pathQuery.value?.startsWith("content/drafts/"))
			);
			if (willShowVersionChoice) {
				versionChoicePending.value = true;
				if (debounceSaveTimer) {
					clearTimeout(debounceSaveTimer);
					debounceSaveTimer = null;
				}
			}
			const parsed = parseFrontmatter(raw, docType.value);
			body.value = parsed.body;
			rawBody.value = parsed.body;
			Object.entries(parsed.meta).forEach(([key, val]) => {
				if (val !== undefined) {
					(meta as Record<string, unknown>)[key] = val;
				}
			});
			nextTick(() => {
				cachedMetaJson.value = serializeMeta();
				lastSavedMetaJson.value = cachedMetaJson.value;
				lastSavedBody.value = normalizeBodyForCompare(rawBody.value);
				lastSavedToLocalSnapshot.value = currentSnapshot();
				serverBaselineSnapshot.value = lastSavedToLocalSnapshot.value;
				const serverAuthor = meta.author;
				const rawDraft =
					typeof localStorage !== "undefined"
						? localStorage.getItem(draftKey.value)
						: null;
				if (rawDraft && docType.value === "post") {
					if (
						pathQuery.value &&
						(pathQuery.value.startsWith("content/blog/") ||
							pathQuery.value.startsWith("content/drafts/"))
					) {
						const identical =
							computeVersionChoiceDiff(rawDraft);
						if (identical) {
							// Local draft is identical to server — silently discard it
							versionChoicePending.value = false;
							clearLocalDraftKey();
							// Skip recovery bar — content is the same
						} else {
							showVersionChoiceModal.value = true;
							isHydratingFromRemote.value = false;
							return;
						}
					} else if (serverLastModified.value) {
						try {
							const draft = JSON.parse(rawDraft);
							const localSavedAt =
								typeof draft.savedAt === "number"
									? draft.savedAt
									: 0;
							const serverTime = new Date(
								serverLastModified.value,
							).getTime();
							if (localSavedAt > serverTime) {
								showRecoveryBar.value = true;
								if (serverAuthor !== undefined)
									meta.author = serverAuthor;
								contentReady.value = true;
								isHydratingFromRemote.value = false;
								setTimeout(() => {
									lastSavedBody.value =
										normalizeBodyForCompare(
											getBodyContent(),
										);
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
					lastSavedBody.value =
						normalizeBodyForCompare(getBodyContent());
					// Re-capture baseline after the editor has stabilized
					// so Milkdown's re-serialization doesn't create a false diff.
					const stableSnapshot = currentSnapshot();
					serverBaselineSnapshot.value = stableSnapshot;
					lastSavedToLocalSnapshot.value = stableSnapshot;
					clearLocalDraftKey();
					isHydratingFromRemote.value = false;
				}, 600);
				contentReady.value = true;
			});
		})
		.catch(() => {
			serverBaselineSnapshot.value = null;
			loadDraft();
			if (docType.value === "post")
				meta.date = getLocalDateTimeString();
			contentReady.value = true;
			isHydratingFromRemote.value = false;
		});
}

async function publish() {
	if (docType.value === "post") {
		if (!ensurePostTitleForSave()) return;
		if (meta.date) {
			meta.edited_at = new Date().toISOString();
		} else {
			meta.date = getLocalDateTimeString();
		}
		meta.author = currentUserAuthorId.value ?? meta.author;
		if (!pathQuery.value) {
			meta.path = `/blog/${slugifyTitle(meta.title)}`;
		}
	}
	const content = `${buildFrontmatterStr()}\n\n${getBodyContent()}`;
	let path = filePath.value;
	if (!path) {
		if (docType.value === "post") {
			const stem =
				meta.path?.replace(/^\/blog\/?/, "").trim() ||
				slugifyTitle(meta.title);
			path = `content/blog/${stem}.md`;
		} else {
			path = `content/authors/${slug.value || meta.name || "new-author"}.md`;
		}
	}
	saving.value = true;
	try {
		if (
			docType.value === "post" &&
			isDraftOnGitHub.value &&
			pathQuery.value
		) {
			const fromPath = pathQuery.value;
			const sourceDraftSha = fileSha.value;
			const stem =
				meta.path?.replace(/^\/blog\/?/, "").trim() ||
				slugifyTitle(meta.title);
			const toPath = `content/blog/${stem}.md`;
			let toSha: string | undefined;
			try {
				const existingTarget = await $fetch<{ sha?: string }>(
					`/api/admin/repo/files?path=${encodeURIComponent(toPath)}`,
				);
				toSha = existingTarget?.sha;
			} catch {
				toSha = undefined;
			}
			const res = await $fetch<{ sha?: string }>(
				"/api/admin/repo/files",
				{
					method: "PUT",
					body: {
						path: toPath,
						content,
						sha: toSha,
						message: `Publish ${toPath} from ${fromPath}`,
					},
				},
			);
			fileSha.value = res?.sha ?? fileSha.value;
			let fromSha = sourceDraftSha;
			if (!fromSha) {
				try {
					const fromInfo = await $fetch<{ sha?: string }>(
						`/api/admin/repo/files?path=${encodeURIComponent(fromPath)}`,
					);
					fromSha = fromInfo?.sha;
				} catch {
					fromSha = undefined;
				}
			}
			if (!fromSha) {
				throw new Error(
					`Failed to resolve source draft SHA for ${fromPath}`,
				);
			}
			await $fetch("/api/admin/repo/files-delete", {
				method: "POST",
				body: {
					path: fromPath,
					sha: fromSha,
					message: `Delete source draft ${fromPath} after publishing ${toPath}`,
				},
			});
			clearLocalDraftKey();
			clearLocalDraftKey(`admin-draft-post-${toPath}`);
			captureLastSavedSnapshot();
			lastSavedToLocalSnapshot.value = currentSnapshot();
			await navigateTo({
				path: "/admin/editor",
				query: { type: "post", path: toPath },
			});
		} else {
			const res = await $fetch<{ sha?: string }>(
				"/api/admin/repo/files",
				{
					method: "PUT",
					body: {
						path,
						content,
						sha: fileSha.value,
						message: pathQuery.value
							? `Update ${path}`
							: `Publish ${path}`,
					},
				},
			);
			fileSha.value = res?.sha ?? fileSha.value;
			clearLocalDraftKey();
			if (docType.value === "post" && path) {
				clearLocalDraftKey(`admin-draft-post-${path}`);
			}
			captureLastSavedSnapshot();
			lastSavedToLocalSnapshot.value = currentSnapshot();
			if (!pathQuery.value && docType.value === "post") {
				const stem =
					meta.path?.replace(/^\/blog\/?/, "").trim() ||
					slugifyTitle(meta.title);
				await navigateTo({
					path: "/admin/editor",
					query: { type: "post", path: `content/blog/${stem}.md` },
				});
			} else if (slug.value) {
				loadFromApi();
			}
		}
	} catch (e) {
		console.error(e);
		toast.error(getApiErrorMessage(e, "儲存失敗，請稍後再試。"));
	} finally {
		saving.value = false;
	}
}

async function saveDraftToGitHub() {
	if (docType.value !== "post") return;
	if (!ensurePostTitleForSave()) return;
	const stem =
		meta.path?.replace(/^\/blog\/?/, "").trim() || slugifyTitle(meta.title);
	const draftPath = `content/drafts/${stem}.md`;
	if (!meta.date) meta.date = getLocalDateTimeString();
	meta.author = currentUserAuthorId.value ?? meta.author;
	const content = `${buildFrontmatterStr()}\n\n${getBodyContent()}`;
	savingDraft.value = true;
	try {
		await $fetch("/api/admin/repo/files", {
			method: "PUT",
			body: {
				path: draftPath,
				content,
				sha:
					isDraftOnGitHub.value && pathQuery.value === draftPath
						? fileSha.value
						: undefined,
				message: pathQuery.value
					? `Update draft ${draftPath}`
					: `Save draft ${draftPath}`,
			},
		});
		clearLocalDraftKey();
		captureLastSavedSnapshot();
		lastSavedToLocalSnapshot.value = currentSnapshot();
		await navigateTo({
			path: "/admin/editor",
			query: { type: "post", path: draftPath },
		});
	} catch (e) {
		console.error(e);
		toast.error(getApiErrorMessage(e, "儲存草稿失敗，請稍後再試。"));
	} finally {
		savingDraft.value = false;
	}
}

async function unpublish() {
	if (
		docType.value !== "post" ||
		!pathQuery.value ||
		!pathQuery.value.startsWith("content/blog/")
	)
		return;
	if (!canEditPost.value) return;
	const fromPath = pathQuery.value;
	const stem = fromPath.replace(/^content\/blog\//, "").replace(/\.md$/, "");
	const toPath = `content/drafts/${stem}`;
	unpublishing.value = true;
	try {
		await $fetch("/api/admin/repo/files-move", {
			method: "POST",
			body: {
				fromPath,
				toPath: toPath.endsWith(".md") ? toPath : `${toPath}.md`,
				message: `Unpublish: move to drafts`,
			},
		});
		clearLocalDraftKey();
		await navigateTo({
			path: "/admin/editor",
			query: { type: "post", path: `content/drafts/${stem}.md` },
		});
	} catch (e) {
		console.error(e);
		toast.error(getApiErrorMessage(e, "取消發布失敗，請稍後再試。"));
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
				const fileRes = await $fetch<{ sha?: string }>(
					`/api/admin/repo/files?path=${encodeURIComponent(pathQuery.value)}`,
				);
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
				toast.error("無法取得檔案 SHA，請重新開啟此草稿後再試。");
				deletingDraft.value = false;
				return;
			}
		}
		clearLocalDraftKey();
		await navigateTo({
			path: "/admin/posts",
			query: pathQuery.value
				? { deletedPath: pathQuery.value, refresh: String(Date.now()) }
				: { refresh: String(Date.now()) },
		});
	} catch (e) {
		console.error(e);
		toast.error(getApiErrorMessage(e, "刪除草稿失敗，請稍後再試。"));
	} finally {
		deletingDraft.value = false;
	}
}

function onFeaturedDrop(e: DragEvent) {
	heroDragOver.value = false;
	const file = e.dataTransfer?.files?.[0];
	if (!file?.type.startsWith("image/")) return;
	openCropper(file);
}

function onFeaturedFileChange(e: Event) {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	input.value = "";
	if (!file) return;
	openCropper(file);
}

function openCropper(file: File) {
	cropperFile.value = file;
	showCropper.value = true;
}

async function onCropperConfirm(cropped: File) {
	try {
		meta.featured_image = await uploadImage(cropped);
	} catch (err) {
		console.error(err);
		toast.error(getApiErrorMessage(err, "上傳失敗，請稍後再試。"));
	} finally {
		cropperFile.value = null;
	}
}

function onCropperCancel() {
	cropperFile.value = null;
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
		toast.error(getApiErrorMessage(err, "上傳失敗，請稍後再試。"));
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
		toast.error(getApiErrorMessage(err, "上傳失敗，請稍後再試。"));
	}
}

watch(
	meta,
	() => {
		cachedMetaJson.value = serializeMeta();
		if (docType.value === "post" && !canEditPost.value) return;
		scheduleDebouncedLocalSave();
	},
	{ deep: true },
);

onMounted(async () => {
	const profilePromise = fetchProfileMe()
		.then((profile: { authorId?: string | null } | null) => {
			currentUserAuthorId.value = profile?.authorId ?? null;
		})
		.catch(() => {
			currentUserAuthorId.value = null;
		});
	await Promise.all([profilePromise, loadFromApi(), fetchAvailableTags()]);
	bodyCheckInterval = setInterval(() => {
		bodyCheckTrigger.value++;
		if (docType.value === "post" && !canEditPost.value) return;
		scheduleDebouncedLocalSave();
	}, 2000);
	beforeUnloadHandler = (e: BeforeUnloadEvent) => {
		if (
			docType.value === "post" &&
			pathQuery.value?.startsWith("content/blog/") &&
			hasUnsavedChanges.value
		) {
			e.preventDefault();
			(e as BeforeUnloadEvent & { returnValue?: string }).returnValue =
				"";
		}
	};
	window.addEventListener("beforeunload", beforeUnloadHandler);
});

const rawMirrorRef = ref<HTMLDivElement | null>(null);

/** Resize raw markdown textarea to fit content (no inner scrollbar).
 * Measures via a hidden mirror div so the textarea never collapses mid-edit,
 * which would otherwise cause the browser to scroll to keep the caret visible. */
function resizeRawTextarea() {
	nextTick(() => {
		const textarea = document.querySelector<HTMLTextAreaElement>(
			".admin-textarea:not(.admin-textarea-mirror)",
		);
		const mirror = rawMirrorRef.value;
		if (!textarea || !mirror) return;
		const width = textarea.getBoundingClientRect().width;
		if (width === 0) return; // Do not resize if hidden via v-show
		mirror.style.width = `${width}px`;
		// Trailing newline ensures a final empty line contributes height.
		mirror.textContent = `${rawBody.value}\n`;
		const h = Math.max(mirror.scrollHeight, 50 * 16);
		textarea.style.height = `${h}px`;
	});
}

watch(
	rawBody,
	() => {
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
	},
	{ flush: "post" },
);

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
	border-radius: var(--radius-full);
}
.admin-status-dot {
	width: 0.5rem;
	height: 0.5rem;
	border-radius: var(--radius-full);
	background: currentColor;
}
.admin-status-spinner {
	animation: admin-spin 0.8s linear infinite;
}
@keyframes admin-spin {
	to {
		transform: rotate(360deg);
	}
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
	background: color-mix(in srgb, var(--color-success) 22%, transparent);
	color: var(--color-success);
}
.admin-status-dot-wrap.status-synced {
	background: color-mix(in srgb, var(--color-primary) 22%, transparent);
	color: var(--color-primary);
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

/* Delete modal: backdrop click triggers shake (do not close) */
.admin-confirm-modal-shake {
	animation: admin-confirm-shake 0.5s ease-in-out;
}
@keyframes admin-confirm-shake {
	0%,
	100% {
		transform: translateX(0);
	}
	15% {
		transform: translateX(-8px);
	}
	30% {
		transform: translateX(8px);
	}
	45% {
		transform: translateX(-6px);
	}
	60% {
		transform: translateX(6px);
	}
	75% {
		transform: translateX(-3px);
	}
	90% {
		transform: translateX(3px);
	}
}

/* Inline title */
.admin-inline-title-wrap {
	margin-bottom: 0.75rem;
	padding-left: 120px;
}
.admin-inline-title {
	width: 100%;
	padding: 0.25rem 0;
	font-size: 2rem;
	font-weight: 700;
	font-family: var(--font-heading);
	line-height: 1.3;
	border: none;
	background: transparent;
	color: var(--color-text-primary);
	outline: none;
}
.admin-inline-title::placeholder {
	color: var(--color-text-tertiary);
	font-weight: 400;
}
.admin-inline-title:focus {
	outline: none;
}
.admin-inline-title-warning {
	display: block;
	margin-top: 0.25rem;
	font-size: 0.75rem;
	color: var(--color-warning-text);
}

/* Obsidian-style properties panel with icons */
.admin-properties-top {
	margin-bottom: 0.5rem;
	padding-left: 120px;
}
.admin-properties-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
/* Mode toggle (編輯/Markdown) — inline with properties header */
.admin-header-mode-toggle {
	display: flex;
	gap: 0;
	border: 1px solid var(--color-border-light);
	border-radius: var(--radius-sm);
	overflow: hidden;
}
.admin-mode-btn {
	padding: 0.25rem 0.75rem;
	font-size: 0.8125rem;
	font-weight: 500;
	border: none;
	background: transparent;
	color: var(--color-text-secondary);
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
	line-height: 1.5;
}
.admin-mode-btn:hover {
	background: var(--color-bg-tertiary);
	color: var(--color-text-primary);
}
.admin-mode-btn.active {
	background: color-mix(in srgb, var(--color-primary) 15%, transparent);
	color: var(--color-primary);
}
.admin-mode-btn + .admin-mode-btn {
	border-left: 1px solid var(--color-border-light);
}
.admin-mode-badge {
	display: inline-block;
	margin-left: 4px;
	padding: 0 6px;
	font-size: 0.6875rem;
	line-height: 1.5;
	background: color-mix(in srgb, var(--color-primary) 18%, transparent);
	color: var(--color-primary);
	border-radius: 999px;
	min-width: 18px;
	text-align: center;
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
	overflow: visible;
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
	transition:
		max-height 0.25s ease-out,
		opacity 0.2s ease-out;
	overflow: hidden;
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
.admin-property-tr-title {
	align-items: start;
}
.admin-property-name {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	color: var(--color-text-secondary);
	flex-shrink: 0;
}
.admin-property-icon {
	opacity: 0.6;
	flex-shrink: 0;
}
.admin-property-field {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
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
.admin-property-hint {
	font-size: 0.72rem;
	line-height: 1.35;
	color: var(--color-text-tertiary);
}
.admin-property-hint-warning {
	color: var(--color-warning-text);
}
.admin-property-readonly {
	opacity: 0.7;
	cursor: default;
}
.admin-property-cell-flex {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.35rem;
}

/* Toggle switch */
.admin-toggle-switch {
	position: relative;
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	user-select: none;
}
.admin-toggle-switch input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}
.admin-toggle-track {
	position: relative;
	width: 2rem;
	height: 1.125rem;
	background: var(--color-bg-tertiary);
	border: 1px solid var(--color-border-light);
	border-radius: var(--radius-pill);
	transition: background 0.2s, border-color 0.2s;
}
.admin-toggle-thumb {
	position: absolute;
	top: 2px;
	left: 2px;
	width: 0.75rem;
	height: 0.75rem;
	background: var(--color-text-tertiary);
	border-radius: 50%;
	transition: transform 0.2s, background 0.2s;
}
.admin-toggle-switch input:checked + .admin-toggle-track {
	background: color-mix(in srgb, var(--color-primary) 20%, transparent);
	border-color: var(--color-primary);
}
.admin-toggle-switch input:checked + .admin-toggle-track .admin-toggle-thumb {
	transform: translateX(0.875rem);
	background: var(--color-primary);
}
.admin-toggle-switch input:disabled + .admin-toggle-track {
	opacity: 0.5;
	cursor: not-allowed;
}

/* More options toggle */
.admin-property-tr-more {
	grid-template-columns: 1fr;
}
.admin-more-toggle {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.2rem 0;
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--color-text-tertiary);
	background: none;
	border: none;
	cursor: pointer;
	user-select: none;
}
.admin-more-toggle:hover {
	color: var(--color-text-secondary);
}

.admin-property-empty {
	color: var(--color-text-tertiary);
	font-size: 0.75rem;
}
.admin-property-thumb {
	width: 40px;
	height: 40px;
	border-radius: var(--radius-xs);
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
	border-radius: var(--radius-xl);
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
	border: 1px solid
		color-mix(in srgb, var(--color-border-light) 68%, transparent);
	border-radius: var(--radius-lg);
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
	border-radius: var(--radius-pill);
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

/* Series autocomplete */
.admin-property-tr-tags {
	position: relative;
	z-index: 50;
}
.admin-property-tr-tags .admin-property-tags-wrap {
	position: relative;
	width: fit-content;
	max-width: min(100%, 28rem);
}
.admin-series-input-wrap,
.admin-property-tags-wrap {
	position: relative;
	width: fit-content;
	max-width: min(100%, 28rem);
}
.admin-series-suggestions {
	position: absolute;
	top: 100%;
	left: 0;
	width: min(22rem, calc(100vw - 3rem));
	z-index: 180;
	background: var(--color-bg-primary);
	border: 1px solid var(--color-border-light);
	border-radius: var(--radius-sm);
	box-shadow: var(--shadow-md);
	max-height: 200px;
	overflow-y: auto;
	margin-top: 0.25rem;
}
.admin-series-suggestion {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.5rem 0.75rem;
	background: none;
	border: none;
	text-align: left;
	cursor: pointer;
	font-size: 0.875rem;
	color: var(--color-text-primary);
}
.admin-series-suggestion:hover {
	background: var(--color-bg-tertiary);
}
.admin-series-suggestion-new {
	color: var(--color-primary);
	font-weight: 500;
}
.admin-series-new-badge {
	font-size: 0.6875rem;
	font-weight: 600;
	padding: 0.125rem 0.375rem;
	background: color-mix(in srgb, var(--color-primary) 18%, transparent);
	border-radius: var(--radius-xs);
	color: var(--color-primary);
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
	border-radius: var(--radius-xs);
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
	border-radius: var(--radius-xs) 0 0 var(--radius-xs);
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
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition:
		background 0.15s,
		color 0.15s,
		border-color 0.15s;
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
	border-radius: var(--radius-sm);
	cursor: pointer;
	border: 1px solid var(--color-border-light);
	background: var(--color-bg-primary);
	color: var(--color-text-primary);
	transition:
		background 0.15s,
		color 0.15s,
		border-color 0.15s;
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
	background: var(--color-danger);
	border-color: var(--color-danger);
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
	box-sizing: border-box;
}
/* Mirror element for height measurement. Inherits .admin-textarea typography
   so wrapping matches the real textarea; positioned off-screen. */
.admin-textarea-mirror {
	position: absolute;
	top: -9999px;
	left: 0;
	visibility: hidden;
	pointer-events: none;
	min-height: 0 !important;
	height: auto !important;
	white-space: pre-wrap;
	word-wrap: break-word;
	overflow-wrap: break-word;
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
	transition:
		color 0.2s ease,
		text-decoration-color 0.2s ease;
}
.admin-wysiwyg-site :deep(.milkdown a:hover) {
	color: var(--color-primary);
	text-decoration-color: var(--color-primary);
}
.admin-wysiwyg-site :deep(.milkdown ul),
.admin-wysiwyg-site :deep(.milkdown ol) {
	margin-bottom: 1.5rem;
	padding-left: 0.5rem;
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
	border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
/* Keep Crepe's virtual cursor above blocks with opaque backgrounds (e.g. blockquote). */
.admin-wysiwyg-site :deep(.milkdown .prosemirror-virtual-cursor) {
	z-index: 1;
}
.admin-wysiwyg-site :deep(.milkdown img) {
	max-width: 100%;
	height: auto;
	border-radius: var(--radius-lg);
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
	border-radius: var(--radius-md);
	overflow: auto;
	margin: 1rem 0;
}
.admin-wysiwyg-site :deep(.milkdown code) {
	font-family: var(--font-mono);
	font-size: 0.9em;
	background: var(--color-bg-tertiary);
	padding: 0.15rem 0.35rem;
	border-radius: var(--radius-xs);
}
.admin-wysiwyg-site :deep(.milkdown hr) {
	border: none;
	border-top: 2px solid var(--color-border-light);
	margin: 2rem 0;
}
/* Editor info-box: match blog .post-content (supports pasted HTML and ::: rendered as div by remark) */
.admin-wysiwyg-site :deep(.milkdown .info-box),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box) {
	padding: var(--space-4) var(--space-6);
	border-radius: var(--radius-md);
	margin: 1.5rem 0;
	border-left: 4px solid;
}
.admin-wysiwyg-site :deep(.milkdown .info-box strong),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box strong) {
	display: inline;
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
	background: var(--color-info-bg);
	border-color: var(--color-info-border);
	color: var(--color-info-text);
}
.admin-wysiwyg-site :deep(.milkdown .info-box-success),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-success) {
	background: var(--color-success-bg);
	border-color: var(--color-success-border);
	color: var(--color-success-text);
}
.admin-wysiwyg-site :deep(.milkdown .info-box-warning),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-warning) {
	background: var(--color-warning-bg);
	border-color: var(--color-warning-border);
	color: var(--color-warning-text);
}
.admin-wysiwyg-site :deep(.milkdown .info-box-error),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror .info-box-error) {
	background: var(--color-error-bg);
	border-color: var(--color-error-border);
	color: var(--color-error-text);
}
/* Colored label spans [text]{.class} in editor */
.admin-wysiwyg-site :deep(.milkdown span[data-span-class]),
.admin-wysiwyg-site :deep(.milkdown .ProseMirror span[data-span-class]) {
	font-weight: 500;
}
/* Color span styles are in ~/assets/css/color-spans.css (loaded globally) */
/* Editor tables: match blog .post-content table styling */
.admin-wysiwyg-site :deep(.milkdown .milkdown-table-block),
.admin-wysiwyg-site :deep(.milkdown-table-block) {
	width: 100%;
	margin: 1.25rem 0 1.5rem;
	font-size: 0.95rem;
	box-shadow: var(--shadow-sm);
	border-radius: var(--radius-md);
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
.admin-wysiwyg-site
	:deep(.milkdown .milkdown-table-block tbody tr:last-child td),
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

/* Version choice modal details */
.version-choice-details {
	font-size: 0.875rem;
}
.version-choice-timestamps {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	padding: var(--space-3);
	background: var(--color-bg-secondary);
	border-radius: var(--radius-md);
	margin-bottom: var(--space-3);
}
.version-choice-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.version-choice-label {
	font-weight: 600;
	color: var(--color-text-primary);
}
.version-choice-time {
	color: var(--color-text-secondary);
	font-variant-numeric: tabular-nums;
}
.version-choice-diff-list {
	margin: 0;
	padding-left: 1.25rem;
	color: var(--color-text-secondary);
	line-height: 1.6;
}
.version-choice-diff-list li {
	margin-bottom: var(--space-1);
}
</style>


