<script setup lang="ts">
// Fetch all posts for tag extraction and sidebar data
const { data: allPosts } = await useAsyncData("all-posts", () =>
	queryCollection("blog").order("date", "DESC").all()
);

// Search query state
const searchQuery = ref("");

// Mobile menu state
const isMobileMenuOpen = ref(false);

// Provide search query and posts to child components
provide("searchQuery", searchQuery);
provide("allPosts", allPosts);

// Current route to determine context
const route = useRoute();
const isPostPage = computed(
	() =>
		route.path !== "/" &&
		route.path !== "/about" &&
		route.path !== "/authors" &&
		route.path !== "/code-of-conduct"
);

// Get current page data to determine author
const { data: currentPage } = await useAsyncData(
	"current-page",
	async () => {
		if (isPostPage.value && route.path !== "/") {
			const blogPage = await queryCollection("blog").path(route.path).first();
			if (blogPage) {
				return blogPage;
			}

			const normalizedStem = route.path.replace(/^\/+/, "");
			if (normalizedStem) {
				const fallbackBlogPage = await queryCollection("blog")
					.where("stem", "=", normalizedStem)
					.first();
				if (fallbackBlogPage) {
					return fallbackBlogPage;
				}
			}
		}
		return false;
	},
	{
		watch: [() => route.path],
	}
);

const currentAuthor = computed(() => {
	if (currentPage.value && typeof currentPage.value === "object") {
		const page = currentPage.value as { author?: string };
		return page.author || null;
	}
	return null;
});

// Close mobile menu when route changes
watch(() => route.path, () => {
	isMobileMenuOpen.value = false;
});
</script>

<template>
	<div class="app-wrapper">
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

		<div class="app-layout">
			<LeftSidebar :current-author="currentAuthor" />

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

			<RightSidebar
				:all-posts="allPosts"
				:is-post-page="isPostPage"
				:search-query="searchQuery"
				@update:search-query="searchQuery = $event"
			/>
		</div>
	</div>
</template>

<style>
/* Header Styles */
.main-header {
	background: var(--color-bg-primary);
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

/* 3-Column Grid Layout */
.app-layout {
	display: grid;
	grid-template-columns: var(--sidebar-left-width) 1fr var(
			--sidebar-right-width
		);
	max-width: 1400px;
	margin: 0 auto;
	gap: 2rem;
	padding: 0 2rem;
}

.main-content {
	padding: 3rem 2rem;
	max-width: var(--content-max-width);
	margin: 0 auto;
	width: 100%;
}

/* Footer Styles */
.site-footer {
	margin-top: 3rem;
	padding: 1.5rem 0;
	border-top: 1px solid var(--color-border-light);
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
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
    font-size: 0.9rem;
}

.copyright {
	font-size: 0.9rem;
	color: var(--color-text-tertiary);
	margin: 0;
}

.footer-links {
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.9rem;
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
	gap: 0.5rem;
	align-items: center;
}

.powered-by > span {
	font-size: 0.85rem;
	color: var(--color-text-tertiary);
}

.service-badges {
	display: flex;
	align-items: center;
	gap: 1.5rem;
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
	height: 20px;
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
	.app-layout {
		grid-template-columns: 1fr;
	}

	/* Hide sidebars on mobile/tablet */
	.app-layout > aside {
		display: none;
	}

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

	.site-footer {
		padding: 2rem 1rem;
	}

	.powered-by {
		margin-top: 1.5rem;
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
