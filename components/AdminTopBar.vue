<script setup lang="ts">
const route = useRoute();
const { user: adminUser } = useAdminAuth();

const adminQuickAddRef = ref<HTMLElement | null>(null);
const adminQuickAddOpen = ref(false);

const isEditorPage = computed(() => route.path.startsWith("/admin/editor"));

watch(
	() => route.path,
	() => {
		adminQuickAddOpen.value = false;
	}
);

function closeQuickAddIfOutside(e: MouseEvent) {
	if (
		adminQuickAddOpen.value &&
		adminQuickAddRef.value &&
		!adminQuickAddRef.value.contains(e.target as Node)
	) {
		adminQuickAddOpen.value = false;
	}
}

onMounted(() => {
	document.addEventListener("click", closeQuickAddIfOutside);
});
onUnmounted(() => {
	document.removeEventListener("click", closeQuickAddIfOutside);
});
</script>

<template>
	<header class="main-header admin-top-bar">
		<div class="header-content admin-top-bar-content">
			<NuxtLink to="/admin" class="admin-top-bar-title">後台</NuxtLink>
			<div id="admin-editor-nav-actions" class="admin-editor-nav-actions" />
			<div id="admin-editor-toolbar" class="admin-editor-toolbar-slot" />
			<div v-if="!isEditorPage" class="admin-nav-spacer" />
			<div class="header-actions">
				<div v-if="!isEditorPage" ref="adminQuickAddRef" class="admin-quick-add-wrap">
					<button
						type="button"
						class="admin-quick-add-btn"
						:aria-expanded="adminQuickAddOpen"
						aria-haspopup="true"
						@click="adminQuickAddOpen = !adminQuickAddOpen"
					>
						快速新增
						<Icon name="heroicons:chevron-down" size="16" />
					</button>
					<Transition name="dropdown">
						<div v-if="adminQuickAddOpen" class="admin-quick-add-dropdown" @click.stop>
							<NuxtLink to="/admin/editor?type=post" class="admin-quick-add-item" @click="adminQuickAddOpen = false">
								新增文章
							</NuxtLink>
						</div>
					</Transition>
				</div>
				<ThemeToggle />
				<template v-if="adminUser">
					<AdminUserPopover />
				</template>
				<NuxtLink v-else to="/" class="admin-top-back">&larr; 返回網站</NuxtLink>
			</div>
		</div>
	</header>
</template>
