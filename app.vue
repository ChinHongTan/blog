<script setup lang="ts">
// Search query state
const searchQuery = ref("");
const isSearchOpen = ref(false);

// Mobile menu state
const isMobileMenuOpen = ref(false);

// Provide search query to child components
provide("searchQuery", searchQuery);

// Current route to determine context
const route = useRoute();
const isPostPage = computed(
	() =>
		route.path !== "/" &&
		route.path !== "/about" &&
		route.path !== "/authors" &&
		route.path !== "/code-of-conduct"
);

// Close mobile menu when route changes
watch(() => route.path, () => {
	isMobileMenuOpen.value = false;
	isSearchOpen.value = false;
});
</script>

<template>
	<div :class="['app-wrapper', { 'post-mood': isPostPage }]">
		<!-- Top Header -->
		<header class="main-header">
			<div class="header-content">
				<NuxtLink to="/" class="logo">
					<!-- Option 1: Profile Picture (Current) -->
					<img
						src="/images/uploads/103467998_p0 copy.png"
						alt="Logo"
						class="logo-image"
					>

					<!-- Option 2: Remove icon completely - just delete the img/Icon line above -->

					<!-- Option 3: Use an icon instead:
          <Icon name="heroicons:academic-cap" size="28" />
          -->

					<span>七糯糯的小站</span>
				</NuxtLink>

				<!-- Header actions: nav + theme toggle + mobile menu button (nav moved to right) -->
				<div class="header-actions">
					<nav class="main-nav">
						<NuxtLink to="/">
							<Icon name="heroicons:home" size="20" />
							<span>首頁</span>
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
						<button
							type="button"
							class="search-toggle"
							:aria-label="isSearchOpen ? '收起搜尋' : '展開搜尋'"
							@click="isSearchOpen = !isSearchOpen"
						>
							<Icon name="heroicons:magnifying-glass" size="18" />
						</button>
						<div class="header-search-shell">
							<Icon name="heroicons:magnifying-glass" size="16" class="header-search-icon" />
							<input
								v-model="searchQuery"
								type="search"
								class="header-search-input"
								placeholder="搜尋文章..."
								:tabindex="isSearchOpen ? 0 : -1"
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
				<NuxtPage />

				<footer class="site-footer">
					<div class="footer-info">
						<p>
							© 2025 七糯糯的小站.
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
			color-mix(in srgb, var(--color-primary-light) 18%, var(--color-bg-primary)),
			color-mix(in srgb, var(--color-bg-primary) 92%, var(--color-accent) 8%)
		),
		var(--color-bg-primary);
	border-bottom: 1px solid var(--color-border-light);
	position: sticky;
	top: 0;
	z-index: 100;
	box-shadow: var(--shadow-sm);
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
	transition: color 0.2s ease;
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
	transition: color 0.2s ease;
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
	gap: 0.35rem;
	min-width: 2.25rem;
}

.search-toggle {
	width: 2.25rem;
	height: 2.25rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: transparent;
	border-radius: 8px;
	color: var(--color-text-primary);
	cursor: pointer;
	transition: all 0.2s ease;
}

.search-toggle:hover {
	background: color-mix(in srgb, var(--color-primary-light) 18%, transparent);
	color: var(--color-primary-dark);
}

.header-search-shell {
	width: 0;
	height: 2.25rem;
	opacity: 0;
	overflow: hidden;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	border: 1px solid transparent;
	border-radius: 999px;
	background: transparent;
	padding: 0;
	transition: width 0.28s ease, opacity 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, padding 0.2s ease;
}

.header-search.open .header-search-shell {
	width: clamp(180px, 20vw, 270px);
	opacity: 1;
	border-color: var(--color-border-light);
	background: color-mix(in srgb, var(--color-bg-primary) 92%, transparent);
	padding: 0 0.72rem;
}

.header-search-icon {
	flex: 0 0 auto;
	color: var(--color-text-tertiary);
}

.header-search-input {
	width: 100%;
	height: 2.25rem;
	border: none;
	background: transparent;
	padding: 0;
	font-size: 0.9rem;
	color: var(--color-text-primary);
	outline: none;
}

.header-search.open .header-search-shell:focus-within {
	border-color: var(--color-primary);
	box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-light) 28%, transparent);
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
	max-width: 1100px;
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
