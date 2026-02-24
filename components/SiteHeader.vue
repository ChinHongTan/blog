<script setup lang="ts">
const props = defineProps<{
	isHeaderHidden: boolean;
	searchQuery: string;
}>();

const emit = defineEmits<{
	(e: "update:searchQuery", value: string): void;
}>();

const isSearchOpen = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
const isMobileMenuOpen = ref(false);

const route = useRoute();

const localSearchQuery = computed({
	get: () => props.searchQuery,
	set: (val: string) => emit("update:searchQuery", val),
});

const toggleSearch = () => {
	isSearchOpen.value = !isSearchOpen.value;
	if (isSearchOpen.value) {
		nextTick(() => {
			searchInputRef.value?.focus();
		});
	}
};

const handleSearchBlur = () => {
	if (!localSearchQuery.value) {
		isSearchOpen.value = false;
	}
};

watch(
	() => route.path,
	() => {
		isMobileMenuOpen.value = false;
		isSearchOpen.value = false;
	}
);

const mobileMenuRef = ref<HTMLElement | null>(null);

function trapFocus(e: KeyboardEvent) {
	if (e.key === "Escape") {
		isMobileMenuOpen.value = false;
		return;
	}
	if (e.key !== "Tab" || !mobileMenuRef.value) return;
	const focusable = mobileMenuRef.value.querySelectorAll<HTMLElement>(
		'a[href], button, input, [tabindex]:not([tabindex="-1"])'
	);
	if (focusable.length === 0) return;
	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	if (e.shiftKey && document.activeElement === first) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && document.activeElement === last) {
		e.preventDefault();
		first.focus();
	}
}

watch(isMobileMenuOpen, (open) => {
	if (open) {
		nextTick(() => {
			const first = mobileMenuRef.value?.querySelector<HTMLElement>('a[href], button');
			first?.focus();
		});
	}
});
</script>

<template>
	<header class="main-header" :class="{ 'header-hidden': isHeaderHidden }">
		<div class="header-content">
			<NuxtLink to="/" class="logo">
				<img
					src="/images/uploads/103467998_p0 copy.png"
					alt="Logo"
					class="logo-image"
				>
				<span>星谷雜貨店</span>
			</NuxtLink>
			<div class="header-actions">
				<nav class="main-nav">
					<NuxtLink to="/">
						<Icon name="heroicons:home" size="20" />
						<span>首頁</span>
					</NuxtLink>
					<NuxtLink to="/series">
						<Icon name="heroicons:bookmark-square" size="20" />
						<span>專欄</span>
					</NuxtLink>
					<NuxtLink to="/about">
						<Icon name="heroicons:information-circle" size="20" />
						<span>關於</span>
					</NuxtLink>
					<NuxtLink to="/authors">
						<Icon name="heroicons:users" size="20" />
						<span>作者</span>
					</NuxtLink>
					<NuxtLink to="/guestbook">
						<Icon name="heroicons:chat-bubble-left-ellipsis" size="20" />
						<span>留言板</span>
					</NuxtLink>
				</nav>
				<div class="header-search" :class="{ open: isSearchOpen }">
					<div class="search-pill">
						<button
							type="button"
							class="search-toggle"
							:aria-label="isSearchOpen ? '收起搜尋' : '展開搜尋'"
							@click="toggleSearch"
						>
							<Icon name="heroicons:magnifying-glass" size="18" />
						</button>
						<input
							ref="searchInputRef"
							v-model="localSearchQuery"
							type="search"
							class="header-search-input"
							placeholder="搜尋文章..."
							:tabindex="isSearchOpen ? 0 : -1"
							@blur="handleSearchBlur"
						>
					</div>
				</div>
				<ThemeToggle />
				<button
					:aria-label="isMobileMenuOpen ? '關閉選單' : '開啟選單'"
					class="mobile-menu-button"
					@click="isMobileMenuOpen = !isMobileMenuOpen"
				>
					<Icon v-if="!isMobileMenuOpen" name="heroicons:bars-3" size="24" />
					<Icon v-else name="heroicons:x-mark" size="24" />
				</button>
			</div>
		</div>
	</header>

	<!-- Mobile Menu Overlay -->
	<Transition name="mobile-menu">
		<div v-if="isMobileMenuOpen" class="mobile-menu-overlay" role="dialog" aria-modal="true" @click="isMobileMenuOpen = false" @keydown="trapFocus">
			<div ref="mobileMenuRef" class="mobile-menu" @click.stop>
				<nav class="mobile-nav">
					<NuxtLink to="/" class="mobile-nav-link">
						<Icon name="heroicons:home" size="20" />
						首頁
					</NuxtLink>
					<NuxtLink to="/series" class="mobile-nav-link">
						<Icon name="heroicons:bookmark-square" size="20" />
						專欄
					</NuxtLink>
					<NuxtLink to="/about" class="mobile-nav-link">
						<Icon name="heroicons:information-circle" size="20" />
						關於
					</NuxtLink>
					<NuxtLink to="/authors" class="mobile-nav-link">
						<Icon name="heroicons:users" size="20" />
						作者
					</NuxtLink>
					<NuxtLink to="/guestbook" class="mobile-nav-link">
						<Icon name="heroicons:chat-bubble-left-ellipsis" size="20" />
						留言板
					</NuxtLink>
					<NuxtLink to="/code-of-conduct" class="mobile-nav-link">
						<Icon name="heroicons:document-text" size="20" />
						行為準則
					</NuxtLink>
					<a href="https://github.com/ChinHongTan/blog" target="_blank" rel="noopener" class="mobile-nav-link">
						<Icon name="simple-icons:github" size="20" />
						網站原始碼
					</a>
					<div class="mobile-toggle-row">
						<span class="mobile-toggle-label">主題</span>
						<ThemeToggle size="md" />
					</div>
				</nav>
			</div>
		</div>
	</Transition>
</template>
