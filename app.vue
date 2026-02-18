<script setup lang="ts">
// Search query state
const searchQuery = ref("");
const isSearchOpen = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

const toggleSearch = () => {
    isSearchOpen.value = !isSearchOpen.value;
    if (isSearchOpen.value) {
        nextTick(() => {
            searchInputRef.value?.focus();
        });
    }
};

const handleSearchBlur = () => {
    if (!searchQuery.value) {
        isSearchOpen.value = false;
    }
};

// Mobile menu state
const isMobileMenuOpen = ref(false);

// Provide search query to child components
provide("searchQuery", searchQuery);

// Current route (must be declared before any watch/computed that uses it)
const route = useRoute();

// Admin top bar (when on /admin)
const adminQuickAddRef = ref<HTMLElement | null>(null);
const adminQuickAddOpen = ref(false);
const { user: adminUser } = useAdminAuth();
watch(() => route.path, () => { adminQuickAddOpen.value = false; });
function closeQuickAddIfOutside(e: MouseEvent) {
	if (adminQuickAddOpen.value && adminQuickAddRef.value && !adminQuickAddRef.value.contains(e.target as Node)) {
		adminQuickAddOpen.value = false;
	}
}
onMounted(() => { document.addEventListener("click", closeQuickAddIfOutside); });
onUnmounted(() => { document.removeEventListener("click", closeQuickAddIfOutside); });
const isAdminRoute = computed(() => route.path.startsWith("/admin"));
const isEditorPage = computed(() => route.path.startsWith("/admin/editor"));
const isPostPage = computed(
	() =>
		route.path !== "/" &&
		route.path !== "/about" &&
		route.path !== "/authors" &&
		route.path !== "/code-of-conduct" &&
		!route.path.startsWith("/series") &&
		!route.path.startsWith("/author/")
);

// Close mobile menu when route changes
watch(() => route.path, () => {
	isMobileMenuOpen.value = false;
	isSearchOpen.value = false;
});

// Scroll-aware header
const isHeaderHidden = ref(false);
const lastScrollY = ref(0);
const scrollThreshold = 10; // Minimum scroll distance to trigger

const handleScroll = () => {
	if (typeof window === "undefined") return;
	
	const currentScrollY = window.scrollY;
	
	// Show header if:
	// 1. Scrolling up
	// 2. At the top of the page
	// 3. Mobile menu is open
	if (
		currentScrollY < lastScrollY.value ||
		currentScrollY < 100 ||
		isMobileMenuOpen.value
	) {
		isHeaderHidden.value = false;
	} 
	// Hide header if:
	// 1. Scrolling down AND past threshold
	// 2. Not at top
	// 3. Mobile menu is closed
	else if (
		currentScrollY > lastScrollY.value &&
		currentScrollY > 100 &&
		Math.abs(currentScrollY - lastScrollY.value) > scrollThreshold
	) {
		isHeaderHidden.value = true;
	}

	lastScrollY.value = currentScrollY;
};

// Throttle scroll handler for performance
let ticking = false;
const onScroll = () => {
	if (!ticking) {
		window.requestAnimationFrame(() => {
			handleScroll();
			ticking = false;
		});
		ticking = true;
	}
};

onMounted(() => {
	window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener("scroll", onScroll);
});
</script>

<template>
	<div :class="['app-wrapper', { 'post-mood': isPostPage }]">
		<!-- Top Header: admin bar when on /admin, otherwise site nav -->
		<header v-if="isAdminRoute" class="main-header admin-top-bar">
			<div class="header-content admin-top-bar-content">
				<NuxtLink to="/admin" class="admin-top-bar-title">後台</NuxtLink>
				<!-- Target for editor Teleport; always present when on admin so nav doesn't break when leaving editor -->
				<div v-if="isAdminRoute" id="admin-editor-nav-actions" class="admin-editor-nav-actions" />
				<!-- Fixed toolbar slot: editor page teleports icon buttons here (middle of top bar) -->
				<div v-if="isAdminRoute" id="admin-editor-toolbar" class="admin-editor-toolbar-slot" />
				<!-- Spacer only when not on editor so toolbar can use full middle space on editor page -->
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
					<NuxtLink v-else to="/" class="admin-top-back">← 返回網站</NuxtLink>
				</div>
			</div>
		</header>
		<header v-else class="main-header" :class="{ 'header-hidden': isHeaderHidden }">
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
								v-model="searchQuery"
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
			<div v-if="isMobileMenuOpen" class="mobile-menu-overlay" @click="isMobileMenuOpen = false">
				<div class="mobile-menu" @click.stop>
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
						<NuxtLink to="/code-of-conduct" class="mobile-nav-link">
							<Icon name="heroicons:document-text" size="20" />
							行為準則
						</NuxtLink>
						<a href="https://github.com/ChinHongTan/blog" target="_blank" rel="noopener" class="mobile-nav-link">
							<Icon name="simple-icons:github" size="20" />
							網站原始碼
						</a>
						<!-- Theme toggle in mobile menu -->
						<div class="mobile-toggle-row">
							<span class="mobile-toggle-label">主題</span>
							<ThemeToggle size="md" />
						</div>
					</nav>
				</div>
			</div>
		</Transition>

		<div :class="['app-layout', { 'post-layout': isPostPage }]">
			<main class="main-content">
				<NuxtLayout>
					<NuxtPage />
				</NuxtLayout>

				<footer v-if="!isAdminRoute" class="site-footer">
					<div class="footer-info">
						<p>
							© 2025 星谷雜貨店.
							<a
								href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
								target="_blank"
								rel="noopener noreferrer"
								class="footer-cc-link"
							>
								CC BY-NC-SA 4.0
							</a>
						</p>
						<p class="footer-cc-text">
							除另有註明外，本站內容採用創用 CC
							姓名標示-非商業性-相同方式分享 4.0 國際授權條款。
						</p>
						<div class="footer-links">
							<NuxtLink to="/code-of-conduct">行為準則</NuxtLink>
							<span class="separator">•</span>
							<a
								href="https://github.com/ChinHongTan/blog"
								target="_blank"
								rel="noopener"
								>GitHub</a
							>
						</div>
					</div>
					<div class="powered-by">
						<span>使用以下工具建構：</span>
						<div class="service-badges">
							<a
								href="https://vercel.com"
								target="_blank"
								rel="noopener"
								class="service-link"
							>
								<img
									src="/images/logos/vercel-logo-black.svg"
									alt="Vercel"
									class="service-logo logo-light"
								>
								<img
									src="/images/logos/vercel-logo-white.svg"
									alt="Vercel"
									class="service-logo logo-dark"
								>
							</a>
							<a
								href="https://nuxt.com"
								target="_blank"
								rel="noopener"
								class="service-link"
							>
								<img
									src="/images/logos/nuxt-logo-green-black.svg"
									alt="Nuxt"
									class="service-logo logo-light"
								>
								<img
									src="/images/logos/nuxt-logo-green-white.svg"
									alt="Nuxt"
									class="service-logo logo-dark"
								>
							</a>
							<a
								href="https://decapcms.org"
								target="_blank"
								rel="noopener"
								class="service-link"
							>
								<img
									src="/images/logos/decap-logo-black.svg"
									alt="Decap CMS"
									class="service-logo decap-logo logo-light"
								>
								<img
									src="/images/logos/decap-logo-white.svg"
									alt="Decap CMS"
									class="service-logo decap-logo logo-dark"
								>
							</a>
						</div>
					</div>
				</footer>
			</main>
		</div>
	</div>
</template>

<style>
.app-wrapper {
	position: relative;
	min-height: 100vh;
	background: var(--color-bg-secondary);
	isolation: isolate;
}

.app-wrapper > * {
	position: relative;
	z-index: 1;
}

/* Admin top bar (replaces site nav when on /admin) */
.admin-top-bar .admin-top-bar-content {
	justify-content: flex-start;
	gap: 1rem;
}
.admin-nav-spacer {
	flex: 1;
	min-width: 0;
}
.admin-editor-nav-actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
.admin-editor-toolbar-slot {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;
	min-width: 0;
	overflow: visible;
}
.admin-editor-toolbar-slot .admin-toolbar-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	padding: 0;
	border: none;
	border-radius: 0.375rem;
	background: transparent;
	color: var(--color-text-secondary);
	cursor: pointer;
	transition: background 0.15s, color 0.15s;
}
.admin-editor-toolbar-slot .admin-toolbar-btn:hover {
	background: var(--color-bg-tertiary);
	color: var(--color-text-primary);
}
.admin-editor-toolbar-slot .admin-toolbar-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.admin-top-bar-title {
	font-weight: 700;
	font-size: 1.125rem;
	color: var(--color-primary);
	text-decoration: none;
}
.admin-top-bar .header-actions {
	display: flex;
	align-items: center;
	gap: 1rem;
}
.admin-quick-add-wrap {
	position: relative;
}
.admin-quick-add-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.4rem 0.75rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--color-text-primary);
	background: var(--color-bg-tertiary);
	border: 1px solid var(--color-border-light);
	border-radius: 0.375rem;
	cursor: pointer;
}
.admin-quick-add-btn:hover {
	background: var(--color-bg-blue-tint);
	border-color: var(--color-primary);
}
.admin-quick-add-dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	margin-top: 0.25rem;
	min-width: 140px;
	background: var(--color-bg-primary);
	border: 1px solid var(--color-border-light);
	border-radius: 0.375rem;
	box-shadow: var(--shadow-lg);
	overflow: hidden;
	z-index: 100;
}
.admin-quick-add-item {
	display: block;
	padding: 0.5rem 0.75rem;
	font-size: 0.875rem;
	color: var(--color-text-primary);
	text-decoration: none;
	transition: background 0.15s;
}
.admin-quick-add-item:hover {
	background: var(--color-bg-tertiary);
}
.admin-top-avatar {
	border-radius: 50%;
}
.admin-top-username {
	font-size: 0.875rem;
	color: var(--color-text-secondary);
}
.admin-top-logout {
	padding: 0.35rem 0.65rem;
	font-size: 0.8125rem;
	color: var(--color-text-secondary);
	background: transparent;
	border: 1px solid var(--color-border-light);
	border-radius: 0.25rem;
	cursor: pointer;
}
.admin-top-logout:hover {
	background: var(--color-bg-tertiary);
	color: var(--color-text-primary);
}
.admin-top-back {
	font-size: 0.875rem;
	color: var(--color-text-secondary);
	text-decoration: none;
}
.admin-top-back:hover {
	color: var(--color-primary);
}
.dropdown-enter-active,
.dropdown-leave-active {
	transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

.app-wrapper.post-mood {
	background:
		radial-gradient(
			1200px 700px at 50% -260px,
			color-mix(in srgb, var(--color-text-primary) 30%, var(--color-bg-secondary)),
			var(--color-bg-secondary)
		),
		linear-gradient(
			180deg,
			color-mix(in srgb, var(--color-text-primary) 24%, var(--color-bg-secondary)),
			var(--color-bg-secondary) 38%
		);
}

.app-wrapper.post-mood::before,
.app-wrapper.post-mood::after {
	content: "";
	position: absolute;
	top: -220px;
	width: 520px;
	height: 360px;
	filter: blur(70px);
	opacity: 0.22;
	pointer-events: none;
	z-index: 0;
	border-radius: 999px;
}

.app-wrapper.post-mood::before {
	left: 6%;
	background: color-mix(in srgb, var(--color-primary-light) 75%, transparent);
}

.app-wrapper.post-mood::after {
	right: 5%;
	background: color-mix(in srgb, var(--color-accent) 65%, transparent);
}

/* Header Styles */
.main-header {
	background:
		linear-gradient(
			90deg,
			color-mix(in srgb, var(--color-primary-light) 18%, transparent),
			color-mix(in srgb, transparent 92%, var(--color-accent) 8%)
		),
		color-mix(in srgb, var(--color-bg-primary) 70%, transparent);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border-bottom: 1px solid color-mix(in srgb, var(--color-border-light) 60%, transparent);
	position: sticky;
	top: 0;
	z-index: 100;
	box-shadow: var(--shadow-sm);
	transition: 
		transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
		background-color 0.3s ease,
		border-color 0.3s ease;
}

.main-header.header-hidden {
	transform: translateY(-100%);
}

.header-content {
	max-width: 1400px;
	margin: 0 auto;
	padding: 0 2rem;
	height: var(--header-height);
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.logo {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-family: var(--font-heading);
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--color-text-primary);
	text-decoration: none;
	transition: color 0.3s ease;
}

.logo-image {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid var(--color-primary-light);
	transition: all 0.2s ease;
}

.logo:hover {
	color: var(--color-primary-dark);
}

.logo:hover .logo-image {
	border-color: var(--color-primary);
	transform: scale(1.05);
}

.main-nav {
	display: flex;
	gap: 1.25rem;
	align-items: center;
}

.main-nav a {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 500;
	color: var(--color-text-secondary);
	text-decoration: none;
	transition: color 0.3s ease;
	padding: 0.5rem 0;
}

.main-nav a:hover {
	color: var(--color-primary-dark);
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.header-search {
	display: flex;
	align-items: center;
	height: 2.25rem;
}

.search-pill {
	display: flex;
	align-items: center;
	height: 100%;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 999px;
	padding: 0;
	transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
	width: 2.25rem; /* Initial width = icon width */
}

.header-search.open .search-pill {
	width: clamp(180px, 20vw, 270px);
	border-color: var(--color-border-light);
	background: color-mix(in srgb, var(--color-bg-primary) 60%, transparent);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	padding-right: 0.75rem;
}

.header-search.open .search-pill:focus-within {
	border-color: var(--color-primary);
	box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-light) 28%, transparent);
}

.search-toggle {
	width: 2.25rem;
	height: 2.25rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: transparent;
	color: var(--color-text-primary);
	cursor: pointer;
	transition: color 0.2s ease;
	flex-shrink: 0;
}

.search-toggle:hover {
	color: var(--color-primary-dark);
}

.header-search-input {
	height: 100%;
	border: none;
	background: transparent;
	padding: 0;
	font-size: 0.9rem;
	color: var(--color-text-primary);
	outline: none;
	width: 0;
	opacity: 0;
	transition: all 0.2s ease;
	margin-left: 0;
}

.header-search.open .header-search-input {
	width: 100%;
	opacity: 1;
	margin-left: 0.25rem;
}

/* Mobile menu button - hidden by default */
.mobile-menu-button {
	display: none;
	background: none;
	border: none;
	color: var(--color-text-primary);
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 6px;
	transition: all 0.2s ease;
}

.mobile-menu-button:hover {
	background: var(--color-bg-secondary);
	color: var(--color-primary);
}

.mobile-menu-button:active {
	transform: scale(0.95);
}

/* Mobile menu overlay */
.mobile-menu-overlay {
	position: fixed;
	top: var(--header-height);
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 90;
	backdrop-filter: blur(2px);
}

.mobile-menu {
	background: var(--color-bg-primary);
	border-bottom: 1px solid var(--color-border-light);
	box-shadow: var(--shadow-lg);
	max-height: calc(100vh - var(--header-height));
	overflow-y: auto;
}

.mobile-nav {
	display: flex;
	flex-direction: column;
}

.mobile-nav-link {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem 1.5rem;
	color: var(--color-text-primary);
	text-decoration: none;
	font-size: 1rem;
	font-weight: 500;
	border-bottom: 1px solid var(--color-border-light);
	transition: all 0.2s ease;
}

.mobile-nav-link:hover {
	background: var(--color-bg-blue-tint);
	color: var(--color-primary-dark);
	padding-left: 2rem;
}

.mobile-nav-link:active {
	background: var(--color-primary-light);
}

/* Mobile theme toggle row */
.mobile-toggle-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1rem 1.5rem;
	border-top: 1px solid var(--color-border-light);
}

.mobile-toggle-label {
	color: var(--color-text-primary);
	font-weight: 600;
}

/* Mobile menu transitions */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
	transition: opacity 0.3s ease;
}

.mobile-menu-enter-active .mobile-menu,
.mobile-menu-leave-active .mobile-menu {
	transition: transform 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
	opacity: 0;
}

.mobile-menu-enter-from .mobile-menu {
	transform: translateY(-100%);
}

.mobile-menu-leave-to .mobile-menu {
	transform: translateY(-100%);
}

.app-layout {
	width: 100%;
	max-width: 1400px;
	margin: 0 auto;
	padding: 0 2rem;
}

.app-layout.post-layout {
	max-width: 1280px;
}

.app-layout.post-layout .main-content {
	max-width: 100%;
	margin: 0;
}

.main-content {
	padding: 3rem 0;
	max-width: 100%;
	margin: 0 auto;
	width: 100%;
}

/* Footer Styles */

.site-footer {
	margin-top: 2.25rem;
	padding: 1rem 0;
	border-top: 1px solid var(--color-border-light);
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	align-items: center;
}

.footer-info {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	align-items: center;
}

.footer-info p {
	margin: 0;
	color: var(--color-text-secondary);
	font-size: 0.85rem;
}

.copyright {
	font-size: 0.9rem;
	color: var(--color-text-tertiary);
	margin: 0;
}

.footer-links {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 0.85rem;
}

.footer-links a {
	color: var(--color-text-secondary);
	text-decoration: none;
	transition: color 0.2s ease;
}

.footer-links a:hover {
	color: var(--color-primary-dark);
}

.footer-links .separator {
	color: var(--color-border-medium);
}

.powered-by {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	align-items: center;
}

.powered-by > span {
	font-size: 0.75rem;
	color: var(--color-text-tertiary);
}

.service-badges {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
	justify-content: center;
}

.service-link {
	display: flex;
	align-items: center;
	opacity: 0.6;
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
	text-decoration: none;
}

.service-link:hover {
	opacity: 1;
	transform: translateY(-2px);
}

.service-logo {
	height: 16px;
	width: auto;
	object-fit: contain;
	display: block;
}

.logo-dark {
	display: none;
}

html.dark .logo-light {
	display: none;
}

html.dark .logo-dark {
	display: block;
}

.service-text {
	font-size: 0.9rem;
	font-weight: 500;
	color: var(--color-text-secondary);
}

/* Responsive Design */
@media (max-width: 1200px) {
	.main-content {
		max-width: 100%;
	}

	/* Show mobile menu button, hide desktop nav */
	.mobile-menu-button {
		display: block;
	}

	.main-nav {
			display: none;
	}

	.header-search-input {
		font-size: 0.88rem;
	}

		.header-actions {
			gap: 0.5rem;
		}
}

@media (max-width: 768px) {
	.header-content {
		padding: 0 1rem;
	}

	.logo {
		font-size: 1.1rem;
	}

	.logo span {
		display: inline; /* Keep the title visible */
	}

	.logo-image {
		width: 32px;
		height: 32px;
	}

	.app-layout {
		padding: 0 1rem;
	}

	.main-content {
		padding: 1.5rem 0;
	}

	.header-search {
		display: none;
	}

	.site-footer {
		padding: 1.5rem 1rem;
		gap: 0.75rem;
	}
}

@media (max-width: 480px) {
	.header-content {
		padding: 0 0.75rem;
	}

	.logo {
		font-size: 1rem;
		gap: 0.5rem;
	}

	.logo-image {
		width: 28px;
		height: 28px;
	}

	.app-layout {
		padding: 0 0.5rem;
	}

	.mobile-nav-link {
		padding: 0.875rem 1rem;
		font-size: 0.95rem;
	}
}
</style>
