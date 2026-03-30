<script setup lang="ts">
import type { BlogCollectionItem } from "@nuxt/content";
import { useAdminAuth } from "~/composables/useAdminAuth";
import { useAdminProfileMe } from "~/composables/useAdminProfileMe";
import { getAuthorId } from "~/composables/useAuthorId";
import {
	parseFrontmatter,
	buildFrontmatter,
} from "~/composables/useEditorFrontmatter";
import { useToast } from "~/composables/useToast";
import BaseModal from "~/components/ui/BaseModal.vue";

definePageMeta({ layout: "admin" });

type LocalPost = {
	id?: string;
	path?: string;
	stem?: string;
	title?: string;
	date?: string | Date;
	author?: string;
	series?: string | string[];
	seriesOrder?: number;
	internalId: string;
};

const {
	user,
	loading: authLoading,
	login,
	authError: permissionMessage,
} = useAdminAuth();
const { profileMe, fetchProfileMe } = useAdminProfileMe();
const toast = useToast();

const selectedSeries = ref<string | null>(null);
const isUpdating = ref(false);
const updateProgressMessage = ref("");
const onlyMyPosts = ref(false);
const newSeriesName = ref("");
const customSeriesNames = ref<string[]>([]);
const isDeleteModalOpen = ref(false);
const seriesToDelete = ref<string | null>(null);

const { data: allPosts, refresh: refreshPosts } = await useAsyncData<
	BlogCollectionItem[]
>("admin-all-posts-series", () => queryCollection("blog").all());

const { data: authors } = await useAsyncData("admin-series-authors", () =>
	queryCollection("authors").all(),
);

const authorNameDirectory = computed<Record<string, string>>(() => {
	const dir: Record<string, string> = {};
	(authors.value ?? []).forEach((entry) => {
		const id = getAuthorId(
			entry as { path?: string; _path?: string; name?: string },
		);
		const name = (entry as { name?: string })?.name?.trim();
		if (id) dir[id] = name || id;
	});
	return dir;
});

const currentAuthorId = computed(() =>
	(profileMe.value?.authorId ?? "").trim().toLowerCase(),
);

function normalizeSeries(post: { series?: string | string[] }): string | null {
	if (Array.isArray(post.series)) {
		const value = post.series[0]?.trim();
		return value || null;
	}
	if (typeof post.series === "string") {
		const value = post.series.trim();
		return value || null;
	}
	return null;
}

function getAuthorDisplayName(authorId?: string): string {
	const key = (authorId ?? "").trim();
	if (!key) return "未知作者";
	return authorNameDirectory.value[key] || key;
}

function getErrorMessage(error: unknown, fallback: string): string {
	const err = error as { data?: { message?: string }; message?: string };
	return err?.data?.message || err?.message || fallback;
}

const visiblePosts = computed(() => {
	const posts = allPosts.value ?? [];
	if (!onlyMyPosts.value) return posts;
	if (!currentAuthorId.value) return [];
	return posts.filter(
		(post) =>
			(post.author ?? "").trim().toLowerCase() === currentAuthorId.value,
	);
});

const uniqueSeries = computed(() => {
	const seriesSet = new Set<string>();
	visiblePosts.value.forEach((post) => {
		const series = normalizeSeries(post);
		if (series) seriesSet.add(series);
	});
	customSeriesNames.value.forEach((name) => {
		const value = name.trim();
		if (value) seriesSet.add(value);
	});
	return Array.from(seriesSet).sort((a, b) => a.localeCompare(b, "zh-Hant"));
});

const localSeriesPosts = ref<LocalPost[]>([]);
const localOtherPosts = ref<LocalPost[]>([]);

function refreshLocalList() {
	if (!selectedSeries.value) {
		localSeriesPosts.value = [];
		localOtherPosts.value = [];
		return;
	}

	const inSeries: LocalPost[] = [];
	const noSeries: LocalPost[] = [];

	visiblePosts.value.forEach((post) => {
		const enriched: LocalPost = {
			...post,
			internalId:
				post.id || post.path || post.stem || Math.random().toString(),
		};
		const postSeries = normalizeSeries(post);
		if (postSeries === selectedSeries.value) {
			inSeries.push(enriched);
		} else if (!postSeries) {
			noSeries.push(enriched);
		}
	});

	inSeries.sort((a, b) => {
		const orderA =
			typeof a.seriesOrder === "number" ? a.seriesOrder : Infinity;
		const orderB =
			typeof b.seriesOrder === "number" ? b.seriesOrder : Infinity;
		if (orderA !== orderB) return orderA - orderB;
		return (
			new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()
		);
	});

	noSeries.sort((a, b) => {
		return (
			new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
		);
	});

	localSeriesPosts.value = inSeries;
	localOtherPosts.value = noSeries;
}

watch(selectedSeries, refreshLocalList);

watch(
	uniqueSeries,
	(seriesList) => {
		if (seriesList.length === 0) {
			selectedSeries.value = null;
			return;
		}
		if (
			!selectedSeries.value ||
			!seriesList.includes(selectedSeries.value)
		) {
			selectedSeries.value = seriesList[0];
		}
	},
	{ immediate: true },
);

watch(visiblePosts, refreshLocalList);

watch(
	user,
	(nextUser) => {
		if (nextUser) void fetchProfileMe();
	},
	{ immediate: true },
);

function createSeries() {
	const value = newSeriesName.value.trim();
	if (!value) return;
	const existing = uniqueSeries.value.find(
		(name) => name.toLowerCase() === value.toLowerCase(),
	);
	if (existing) {
		selectedSeries.value = existing;
		newSeriesName.value = "";
		return;
	}
	customSeriesNames.value.push(value);
	customSeriesNames.value.sort((a, b) => a.localeCompare(b, "zh-Hant"));
	selectedSeries.value = value;
	newSeriesName.value = "";
	toast.success(`已建立系列「${value}」`);
}

function promptDeleteSeries() {
	if (!selectedSeries.value || isUpdating.value) return;
	seriesToDelete.value = selectedSeries.value;
	isDeleteModalOpen.value = true;
}

async function confirmDeleteSeries() {
	const targetSeries = seriesToDelete.value;
	if (!targetSeries || isUpdating.value) return;

	isDeleteModalOpen.value = false;
	seriesToDelete.value = null;

	const affectedPosts = (allPosts.value ?? []).filter(
		(post) => normalizeSeries(post) === targetSeries,
	);

	if (affectedPosts.length === 0) {
		customSeriesNames.value = customSeriesNames.value.filter(
			(name) => name !== targetSeries,
		);
		selectedSeries.value = uniqueSeries.value[0] ?? null;
		refreshLocalList();
		toast.success(`已刪除系列「${targetSeries}」`);
		return;
	}

	isUpdating.value = true;
	toast.info(`正在刪除系列「${targetSeries}」...`);

	try {
		let successCount = 0;
		for (let i = 0; i < affectedPosts.length; i++) {
			const post = affectedPosts[i];
			const title = post.title || "(無標題)";
			updateProgressMessage.value = `正在更新 ${i + 1}/${affectedPosts.length}: ${title}...`;

			const derivedStem = post.id
				? post.id.replace(/^blog\//, "").replace(/\.md$/, "")
				: post.stem;
			const correctPath =
				post.path && post.path !== "/blog"
					? post.path
					: derivedStem
						? `/${derivedStem}`
						: "";
			if (!correctPath) continue;

			const fileData = await $fetch<{ content: string; sha: string }>(
				`/api/admin/repo/files?path=${encodeURIComponent(correctPath)}`,
			);
			if (!fileData?.content) continue;

			const { meta, body } = parseFrontmatter(fileData.content, "post");
			meta.series = undefined;
			(meta as Record<string, unknown>).seriesOrder = undefined;
			const newContent =
				buildFrontmatter(
					"post",
					meta as Parameters<typeof buildFrontmatter>[1],
				) +
				"\n\n" +
				body;

			await $fetch("/api/admin/repo/files", {
				method: "PUT",
				body: {
					path: correctPath,
					content: newContent,
					sha: fileData.sha,
					message: `Remove series ${targetSeries} from ${meta.title || correctPath}`,
				},
			});
			successCount++;
		}

		customSeriesNames.value = customSeriesNames.value.filter(
			(name) => name !== targetSeries,
		);
		await refreshPosts();
		selectedSeries.value = uniqueSeries.value[0] ?? null;
		refreshLocalList();

		if (successCount > 0) {
			toast.success(
				`已從 ${successCount} 篇文章移除系列「${targetSeries}」`,
			);
		} else {
			toast.success(`已刪除系列「${targetSeries}」`);
		}
	} catch (error: unknown) {
		console.error("Error removing series:", error);
		toast.error(getErrorMessage(error, "刪除系列時發生未知錯誤"));
	} finally {
		isUpdating.value = false;
		updateProgressMessage.value = "";
	}
}

const draggedItemIndex = ref<number | null>(null);
const draggedSourceList = ref<"series" | "other" | null>(null);

function onDragStart(
	e: DragEvent,
	index: number,
	sourceList: "series" | "other",
) {
	draggedItemIndex.value = index;
	draggedSourceList.value = sourceList;
	if (e.dataTransfer) {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.dropEffect = "move";
		e.dataTransfer.setData("text/plain", index.toString());
	}
	requestAnimationFrame(() => {
		const target = e.target as HTMLElement;
		if (target) target.classList.add("is-dragging");
	});
}

function onDragEnterSeries(e: DragEvent, index: number) {
	e.preventDefault();
	if (draggedItemIndex.value === null) return;
	if (
		draggedSourceList.value === "series" &&
		draggedItemIndex.value !== index
	) {
		const items = [...localSeriesPosts.value];
		const draggedItem = items[draggedItemIndex.value];
		items.splice(draggedItemIndex.value, 1);
		items.splice(index, 0, draggedItem);
		localSeriesPosts.value = items;
		draggedItemIndex.value = index;
	}
}

function onDragEnterOther(e: DragEvent, index: number) {
	e.preventDefault();
	if (draggedItemIndex.value === null) return;
	if (
		draggedSourceList.value === "other" &&
		draggedItemIndex.value !== index
	) {
		const items = [...localOtherPosts.value];
		const draggedItem = items[draggedItemIndex.value];
		items.splice(draggedItemIndex.value, 1);
		items.splice(index, 0, draggedItem);
		localOtherPosts.value = items;
		draggedItemIndex.value = index;
	}
}

function onDragOver(e: DragEvent) {
	e.preventDefault();
}

function onDropOnSeries(e: DragEvent) {
	e.preventDefault();
	if (draggedItemIndex.value === null) return;
	if (draggedSourceList.value === "other") {
		const item = localOtherPosts.value[draggedItemIndex.value];
		localOtherPosts.value.splice(draggedItemIndex.value, 1);
		localSeriesPosts.value.push(item);
	}
	onDragEnd(e);
}

function onDropOnOther(e: DragEvent) {
	e.preventDefault();
	if (draggedItemIndex.value === null) return;
	if (draggedSourceList.value === "series") {
		const item = localSeriesPosts.value[draggedItemIndex.value];
		localSeriesPosts.value.splice(draggedItemIndex.value, 1);
		localOtherPosts.value.unshift(item);
	}
	onDragEnd(e);
}

async function onDragEnd(e: DragEvent) {
	const target = e.target as HTMLElement;
	if (target) target.classList.remove("is-dragging");
	document
		.querySelectorAll(".is-dragging")
		.forEach((el) => el.classList.remove("is-dragging"));

	if (draggedItemIndex.value === null) return;
	draggedItemIndex.value = null;
	draggedSourceList.value = null;
	await checkAndSaveOrder();
}

async function checkAndSaveOrder() {
	if (isUpdating.value || !selectedSeries.value) return;

	const postsToUpdate: Array<{
		post: LocalPost;
		nextSeries: string | null;
		nextOrder?: number;
		action: "assign_or_reorder" | "remove";
	}> = [];

	for (let i = 0; i < localSeriesPosts.value.length; i++) {
		const post = localSeriesPosts.value[i];
		const requiredOrder = i + 1;
		const currentSeries = normalizeSeries(post);
		const orderNeedsUpdate = post.seriesOrder !== requiredOrder;
		const seriesNeedsUpdate = currentSeries !== selectedSeries.value;
		if (orderNeedsUpdate || seriesNeedsUpdate) {
			postsToUpdate.push({
				post,
				nextSeries: selectedSeries.value,
				nextOrder: requiredOrder,
				action: "assign_or_reorder",
			});
		}
	}

	for (let i = 0; i < localOtherPosts.value.length; i++) {
		const post = localOtherPosts.value[i];
		const currentSeries = normalizeSeries(post);
		if (currentSeries === selectedSeries.value) {
			postsToUpdate.push({ post, nextSeries: null, action: "remove" });
		}
	}

	if (postsToUpdate.length === 0) return;

	isUpdating.value = true;
	toast.info("開始更新序列...");

	try {
		let successCount = 0;
		for (let i = 0; i < postsToUpdate.length; i++) {
			const { post, nextSeries, nextOrder, action } = postsToUpdate[i];
			const title = post.title || "(無標題)";
			updateProgressMessage.value = `正在更新 ${i + 1}/${postsToUpdate.length}: ${title}...`;

			const derivedStem = post.id
				? post.id.replace(/^blog\//, "").replace(/\.md$/, "")
				: post.stem;
			const correctPath =
				post.path && post.path !== "/blog"
					? post.path
					: derivedStem
						? `/${derivedStem}`
						: "";
			if (!correctPath) continue;

			const fileData = await $fetch<{ content: string; sha: string }>(
				`/api/admin/repo/files?path=${encodeURIComponent(correctPath)}`,
			);
			if (!fileData?.content) continue;

			const { meta, body } = parseFrontmatter(fileData.content, "post");
			if (action === "assign_or_reorder" && nextSeries) {
				meta.series = [nextSeries];
				(meta as Record<string, unknown>).seriesOrder = nextOrder;
			} else {
				meta.series = undefined;
				(meta as Record<string, unknown>).seriesOrder = undefined;
			}
			const newContent =
				buildFrontmatter(
					"post",
					meta as Parameters<typeof buildFrontmatter>[1],
				) +
				"\n\n" +
				body;

			await $fetch("/api/admin/repo/files", {
				method: "PUT",
				body: {
					path: correctPath,
					content: newContent,
					sha: fileData.sha,
					message:
						action === "remove"
							? `Remove ${meta.title || correctPath} from series`
							: `Update series order for ${meta.title || correctPath}`,
				},
			});
			successCount++;
		}

		if (successCount > 0) {
			toast.success(`成功更新 ${successCount} 篇文章`);
		}

		await refreshPosts();
		refreshLocalList();
	} catch (error: unknown) {
		console.error("Error saving series order:", error);
		toast.error(getErrorMessage(error, "儲存時發生未知錯誤"));
	} finally {
		isUpdating.value = false;
		updateProgressMessage.value = "";
	}
}

function resolvePostPath(post: LocalPost): string {
	if (post.path && post.path !== "/blog") return post.path;
	if (post.id) {
		const derivedStem = post.id.replace(/^blog\//, "").replace(/\.md$/, "");
		return `/${derivedStem}`;
	}
	return post.stem ? `/${post.stem}` : "";
}
</script>

<template>
	<div class="admin-series-page">
		<div v-if="authLoading" class="admin-loading">載入中…</div>
		<div v-else-if="!user" class="admin-login">
			<h1>後台</h1>
			<p>請使用 GitHub 登入以管理系列順序。</p>
			<button type="button" class="ui-btn ui-btn-primary" @click="login">
				使用 GitHub 登入
			</button>
			<p v-if="permissionMessage" class="admin-login-error">
				{{ permissionMessage }}
			</p>
		</div>
		<template v-else>
			<div class="admin-series-header">
				<h2 class="admin-title">管理系列</h2>
				<p class="admin-subtitle">
					拖曳文章來排序與加入/移出系列。右側僅顯示「尚未加入任何系列」的文章。
				</p>
				<div class="admin-filter-row">
					<button
						type="button"
						class="ui-btn admin-mine-filter-btn"
						:class="{ 'ui-btn-primary': onlyMyPosts }"
						@click="onlyMyPosts = !onlyMyPosts"
						:disabled="!currentAuthorId"
					>
						只顯示我的文章
					</button>
					<span
						v-if="onlyMyPosts && currentAuthorId"
						class="admin-filter-note"
					>
						目前作者：{{ getAuthorDisplayName(currentAuthorId) }}
					</span>
				</div>
			</div>

			<div class="admin-series-container">
				<div class="admin-series-sidebar">
					<h3 class="admin-sidebar-title">系列列表</h3>
					<div class="admin-series-create-row">
						<input
							v-model="newSeriesName"
							type="text"
							class="admin-series-create-input"
							placeholder="新增系列名稱"
							@keydown.enter.prevent="createSeries"
						/>
						<button
							type="button"
							class="ui-btn ui-btn-primary admin-series-create-btn"
							@click="createSeries"
						>
							新增
						</button>
					</div>
					<ul class="admin-series-list">
						<li
							v-if="uniqueSeries.length === 0"
							class="admin-series-list-empty"
						>
							尚無系列
						</li>
						<li
							v-for="seriesName in uniqueSeries"
							:key="seriesName"
							class="admin-series-list-item"
							:class="{ active: selectedSeries === seriesName }"
							@click="selectedSeries = seriesName"
						>
							{{ seriesName }}
						</li>
					</ul>
					<button
						v-if="selectedSeries"
						type="button"
						class="ui-btn ui-btn-danger admin-series-delete-btn"
						:disabled="isUpdating"
						@click="promptDeleteSeries"
					>
						刪除目前系列
					</button>
				</div>

				<div v-if="selectedSeries" class="admin-drag-container">
					<div class="admin-series-content">
						<div class="admin-series-toolbar">
							<h3 class="admin-series-content-title">
								「{{ selectedSeries }}」的文章
							</h3>
							<div
								v-if="isUpdating"
								class="admin-indicator-updating"
							>
								<Icon
									name="heroicons:arrow-path"
									class="animate-spin"
									size="16"
								/>
								{{ updateProgressMessage || "儲存中..." }}
							</div>
						</div>

						<ul
							class="admin-drag-list"
							:class="{ 'is-updating': isUpdating }"
							@dragover="onDragOver"
							@drop="onDropOnSeries"
						>
							<li
								v-if="localSeriesPosts.length === 0"
								class="admin-empty-content-box"
							>
								這個系列目前沒有文章，從右側拖曳加入。
							</li>
							<li
								v-for="(post, index) in localSeriesPosts"
								:key="post.internalId"
								class="admin-drag-item"
								:draggable="!isUpdating"
								@dragstart="
									onDragStart($event, index, 'series')
								"
								@dragenter="onDragEnterSeries($event, index)"
								@dragend="onDragEnd"
							>
								<div class="drag-handle">
									<Icon name="heroicons:bars-3" size="20" />
								</div>
								<span class="drag-order">#{{ index + 1 }}</span>
								<div class="drag-info">
									<strong class="drag-title">{{
										post.title
									}}</strong>
									<span class="drag-author">{{
										getAuthorDisplayName(post.author)
									}}</span>
								</div>
								<a
									:href="`${resolvePostPath(post)}`"
									target="_blank"
									class="drag-view-btn"
									title="查看文章"
								>
									<Icon
										name="heroicons:arrow-top-right-on-square"
										size="18"
									/>
								</a>
							</li>
						</ul>
					</div>

					<div class="admin-series-content">
						<div class="admin-series-toolbar">
							<h3 class="admin-series-content-title">
								可加入文章（無系列）
							</h3>
						</div>

						<ul
							class="admin-drag-list"
							:class="{ 'is-updating': isUpdating }"
							@dragover="onDragOver"
							@drop="onDropOnOther"
						>
							<li
								v-if="localOtherPosts.length === 0"
								class="admin-empty-content-box"
							>
								沒有其他文章了。
							</li>
							<li
								v-for="(post, index) in localOtherPosts"
								:key="post.internalId"
								class="admin-drag-item"
								:draggable="!isUpdating"
								@dragstart="onDragStart($event, index, 'other')"
								@dragenter="onDragEnterOther($event, index)"
								@dragend="onDragEnd"
							>
								<div class="drag-handle">
									<Icon name="heroicons:bars-3" size="20" />
								</div>
								<div class="drag-info">
									<strong class="drag-title">{{
										post.title
									}}</strong>
									<span class="drag-author">{{
										getAuthorDisplayName(post.author)
									}}</span>
								</div>
								<a
									:href="`${resolvePostPath(post)}`"
									target="_blank"
									class="drag-view-btn"
									title="查看文章"
								>
									<Icon
										name="heroicons:arrow-top-right-on-square"
										size="18"
									/>
								</a>
							</li>
						</ul>
					</div>
				</div>
				<div v-else class="admin-empty-content-box">
					先建立或選擇一個系列。
				</div>
			</div>

			<BaseModal
				:model-value="isDeleteModalOpen"
				:title="`確定要刪除系列「${seriesToDelete}」嗎？`"
				description="這會移除所有文章的該系列設定，但不會刪除文章本身。此操作將立即生效且無法復原。"
				variant="danger"
				role="alertdialog"
				@update:model-value="isDeleteModalOpen = $event"
			>
				<template #actions>
					<button
						type="button"
						class="ui-btn ui-btn-ghost"
						@click="isDeleteModalOpen = false"
					>
						取消
					</button>
					<button
						type="button"
						class="ui-btn ui-btn-danger"
						@click="confirmDeleteSeries"
					>
						確定刪除
					</button>
				</template>
			</BaseModal>
		</template>
	</div>
</template>

<style scoped>
.admin-series-page {
	max-width: 1200px;
	margin: 0 auto;
}

.admin-title {
	font-size: 1.8rem;
	font-weight: 700;
	color: var(--color-text-primary);
	margin: 0;
}

.admin-subtitle {
	font-size: 0.95rem;
	color: var(--color-text-secondary);
	margin: 0.5rem 0 1rem;
}

.admin-filter-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-wrap: wrap;
	margin-bottom: 1.5rem;
}

.admin-mine-filter-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
}

.admin-filter-note {
	font-size: 0.85rem;
	color: var(--color-text-muted);
}

.admin-series-container {
	display: grid;
	grid-template-columns: 240px 1fr;
	gap: 2rem;
	align-items: start;
}

.admin-drag-container {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.5rem;
	align-items: start;
}

@media (max-width: 1024px) {
	.admin-drag-container {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 768px) {
	.admin-series-container {
		grid-template-columns: 1fr;
	}
}

.admin-series-sidebar {
	background: var(--color-bg-primary);
	border: 1px solid var(--color-border-light);
	border-radius: var(--radius-md);
	padding: 1rem;
	box-shadow: var(--shadow-sm);
}

.admin-sidebar-title {
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 1rem;
	color: var(--color-text-primary);
	padding-bottom: 0.5rem;
	border-bottom: 1px solid var(--color-border-light);
}

.admin-series-create-row {
	display: flex;
	gap: 0.5rem;
	margin-bottom: 0.85rem;
}

.admin-series-create-input {
	width: 100%;
	padding: 0.5rem 0.65rem;
	border: 1px solid var(--color-border-light);
	border-radius: var(--radius-sm);
	background: var(--color-bg-secondary);
	color: var(--color-text-primary);
	font-size: 0.9rem;
}

.admin-series-create-btn {
	white-space: nowrap;
}

.admin-series-list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.admin-series-list-empty {
	padding: 0.65rem 0.8rem;
	font-size: 0.88rem;
	color: var(--color-text-muted);
}

.admin-series-list-item {
	padding: 0.6rem 0.8rem;
	border-radius: var(--radius-sm);
	cursor: pointer;
	font-size: 0.95rem;
	color: var(--color-text-secondary);
	transition: all 0.2s;
	user-select: none;
}

.admin-series-list-item:hover {
	background: var(--color-bg-tertiary);
	color: var(--color-text-primary);
}

.admin-series-list-item.active {
	background: var(--color-bg-blue-tint);
	color: var(--color-primary);
	font-weight: 500;
}

.admin-series-delete-btn {
	width: 100%;
	margin-top: 0.9rem;
}

.admin-series-content {
	min-width: 0;
	background: var(--color-bg-primary);
	border: 1px solid var(--color-border-light);
	border-radius: var(--radius-md);
	padding: 1.5rem;
	box-shadow: var(--shadow-sm);
}

.admin-series-toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--color-border-light);
}

.admin-series-content-title {
	font-size: 1.2rem;
	font-weight: 600;
	color: var(--color-text-primary);
	margin: 0;
}

.admin-indicator-updating {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.9rem;
	color: var(--color-primary);
	font-weight: 500;
	background: var(--color-bg-blue-tint);
	padding: 0.4rem 0.8rem;
	border-radius: var(--radius-full);
}

.animate-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.admin-drag-list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	min-height: 100px;
}

.admin-drag-list.is-updating {
	opacity: 0.6;
	pointer-events: none;
}

.admin-drag-item {
	display: flex;
	align-items: center;
	gap: 1rem;
	background: var(--color-bg-secondary);
	border: 1px solid var(--color-border-light);
	padding: 0.75rem 1rem;
	border-radius: var(--radius-sm);
	cursor: grab;
	transition:
		box-shadow 0.2s,
		background 0.2s,
		border-color 0.2s;
}

.admin-drag-item:hover {
	border-color: var(--color-border-main);
	box-shadow: var(--shadow-sm);
}

.admin-drag-item:active {
	cursor: grabbing;
}

.admin-drag-item.is-dragging {
	opacity: 0.5;
	background: var(--color-bg-blue-tint);
	border: 1px dashed var(--color-primary);
}

.drag-handle {
	color: var(--color-text-muted);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: grab;
}

.admin-drag-item:active .drag-handle {
	cursor: grabbing;
}

.drag-order {
	font-family: monospace;
	font-weight: 600;
	font-size: 1.1rem;
	color: var(--color-text-secondary);
	min-width: 2rem;
}

.drag-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	min-width: 0;
}

.drag-title {
	font-size: 1rem;
	color: var(--color-text-primary);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.drag-author {
	font-size: 0.8rem;
	color: var(--color-text-muted);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.drag-view-btn {
	color: var(--color-text-muted);
	padding: 0.4rem;
	border-radius: var(--radius-sm);
	transition: all 0.2s;
	user-select: none;
	line-height: 0;
}

.drag-view-btn:hover {
	color: var(--color-primary);
	background: var(--color-bg-tertiary);
}

.admin-empty,
.admin-empty-content-box {
	padding: 3rem;
	text-align: center;
	color: var(--color-text-muted);
	background: var(--color-bg-primary);
	border: 1px dashed var(--color-border-light);
	border-radius: var(--radius-md);
}
</style>
