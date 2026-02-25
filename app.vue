<script setup lang="ts">
import { Analytics } from "@vercel/analytics/vue";

const searchQuery = ref("");

provide("searchQuery", searchQuery);

const route = useRoute();

const isAdminRoute = computed(() => route.path.startsWith("/admin"));
const isPostPage = computed(
	() =>
		route.path !== "/" &&
		route.path !== "/about" &&
		route.path !== "/authors" &&
		route.path !== "/code-of-conduct" &&
		!route.path.startsWith("/series") &&
		!route.path.startsWith("/author/")
);

// Scroll-aware header
const isHeaderHidden = ref(false);
const lastScrollY = ref(0);
const scrollThreshold = 10;

const handleScroll = () => {
	if (typeof window === "undefined") return;
	const currentScrollY = window.scrollY;
	if (
		currentScrollY < lastScrollY.value ||
		currentScrollY < 100
	) {
		isHeaderHidden.value = false;
	} else if (
		currentScrollY > lastScrollY.value &&
		currentScrollY > 100 &&
		Math.abs(currentScrollY - lastScrollY.value) > scrollThreshold
	) {
		isHeaderHidden.value = true;
	}
	lastScrollY.value = currentScrollY;
};

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
		<Analytics />
		<NuxtLoadingIndicator color="var(--color-primary)" :height="3" />
		<ToastContainer />
		<AdminTopBar v-if="isAdminRoute" />
		<SiteHeader
			v-else
			v-model:search-query="searchQuery"
			:is-header-hidden="isHeaderHidden"
		/>

		<div :class="['app-layout', { 'post-layout': isPostPage }]">
			<main class="main-content">
				<NuxtLayout>
					<NuxtPage />
				</NuxtLayout>

				<SiteFooter v-if="!isAdminRoute" />
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
	overflow-x: clip;
}

.app-wrapper > * {
	position: relative;
	z-index: 1;
}

/* Admin top bar */
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
	border-radius: var(--radius-sm);
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
	border-radius: var(--radius-sm);
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
	border-radius: var(--radius-sm);
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
	border-radius: var(--radius-sm);
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
	z-index: var(--z-header);
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
	width: 100%;
	margin: 0 auto;
	padding: 0 2rem;
	height: var(--header-height);
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-width: 0;
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
	min-width: 0;
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
	width: 2.25rem;
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

.mobile-menu-button {
	display: none;
	background: none;
	border: none;
	color: var(--color-text-primary);
	cursor: pointer;
	padding: 0.5rem;
	border-radius: var(--radius-sm);
	transition: all 0.2s ease;
}

.mobile-menu-button:hover {
	background: var(--color-bg-secondary);
	color: var(--color-primary);
}

.mobile-menu-button:active {
	transform: scale(0.95);
}

.mobile-menu-overlay {
	position: fixed;
	top: var(--header-height);
	left: 0;
	right: 0;
	bottom: 0;
	background: var(--overlay-bg);
	z-index: var(--z-overlay);
	backdrop-filter: blur(var(--overlay-blur));
	-webkit-backdrop-filter: blur(var(--overlay-blur));
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

/* Responsive Design */
@media (max-width: 1200px) {
	.main-content {
		max-width: 100%;
	}

	.mobile-menu-button {
		display: block;
	}

	.main-nav {
		display: none;
	}

	.header-search {
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
		display: inline;
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
