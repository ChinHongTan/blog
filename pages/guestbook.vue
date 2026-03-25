<script setup lang="ts">
import { init as initWaline } from "@waline/client";
useHead({
	title: "留言板 - 星谷雜貨店",
	link: [
		{
			rel: "stylesheet",
			href: "https://unpkg.com/@waline/client@v3/dist/waline.css",
		},
	],
});

useSeoMeta({
	title: "留言板 - 星谷雜貨店",
	ogTitle: "留言板 - 星谷雜貨店",
	description: "可以在這裡留言或者聊天～",
	ogDescription: "可以在這裡留言或者聊天～",
});

const composerCollapsed = ref(true);

onMounted(() => {
	initWaline({
		el: "#guestbook-waline",
		serverURL: "https://waline.chinono.dev",
		path: "/guestbook",
		lang: "zh-TW",
		meta: ["nick", "link"],
		requiredMeta: ["nick"],
		dark: "html.dark",
	});
});
</script>

<template>
	<div class="guestbook-page">
		<header class="guestbook-header">
			<h1 class="guestbook-title">留言板</h1>
			<p class="guestbook-subtitle">可以在這裡留言或者聊天～</p>
			<button
				type="button"
				class="guestbook-composer-toggle"
				:aria-expanded="!composerCollapsed"
				aria-controls="guestbook-waline"
				@click="composerCollapsed = !composerCollapsed"
			>
				{{ composerCollapsed ? "點這裡留言" : "收起" }}
			</button>
		</header>
		<div
			class="guestbook-waline-wrap"
			:class="{ 'is-composer-collapsed': composerCollapsed }"
		>
			<div id="guestbook-waline" />
		</div>
	</div>
</template>

<style scoped>
.guestbook-page {
	max-width: 860px;
	margin: 0 auto;
	padding: 2rem 0 1rem;
}

.guestbook-header {
	text-align: center;
	margin-bottom: 2.25rem;
}

.guestbook-title {
	font-size: 2.15rem;
	font-weight: 700;
	margin: 0 0 0.65rem;
}

.guestbook-subtitle {
	color: var(--color-text-secondary);
	font-size: 1rem;
	margin: 0;
}

.guestbook-composer-toggle {
	margin-top: 0.9rem;
	border: 1px solid var(--color-border-light);
	background: color-mix(in srgb, var(--color-bg-primary) 68%, transparent);
	color: var(--color-text-secondary);
	padding: 0.35rem 0.85rem;
	border-radius: var(--radius-pill);
	font-size: 0.82rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
}

.guestbook-composer-toggle:hover {
	color: var(--color-primary-dark);
	border-color: color-mix(
		in srgb,
		var(--color-primary) 55%,
		var(--color-border-light)
	);
	background: color-mix(in srgb, var(--color-bg-primary) 82%, transparent);
}

.guestbook-waline-wrap {
	min-height: 300px;
	padding: 0.25rem 0 0.5rem;
	border: none;
	background: transparent;
	box-shadow: none;
}

/* Make the guestbook feel less like a boxed card */
.guestbook-waline-wrap :deep(.wl-container) {
	background: transparent;
}

.guestbook-waline-wrap :deep(.wl-panel) {
	background: color-mix(in srgb, var(--color-bg-primary) 50%, transparent);
	border: 1px solid
		color-mix(in srgb, var(--color-border-light) 78%, transparent);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-sm);
	padding: 0.75rem;
	max-height: 520px;
	opacity: 1;
	overflow: hidden;
	transition:
		max-height 0.28s ease,
		opacity 0.2s ease,
		margin-bottom 0.2s ease;
	margin-bottom: 0.8rem;
}

.guestbook-waline-wrap.is-composer-collapsed :deep(.wl-panel) {
	max-height: 0;
	opacity: 0;
	margin-bottom: 0;
	pointer-events: none;
}

.guestbook-waline-wrap :deep(.wl-editor),
.guestbook-waline-wrap :deep(.wl-input) {
	background: color-mix(in srgb, var(--color-bg-primary) 58%, transparent);
	border-color: color-mix(
		in srgb,
		var(--color-border-light) 72%,
		transparent
	);
	border-radius: var(--radius-lg);
}

.guestbook-waline-wrap :deep(.wl-card) {
	background: transparent;
	border-left: none;
	border-right: none;
	border-radius: 0;
	padding-left: 0;
	padding-right: 0;
}

.guestbook-waline-wrap :deep(.wl-meta),
.guestbook-waline-wrap :deep(.wl-sort),
.guestbook-waline-wrap :deep(.wl-actions) {
	background: transparent;
}

@media (max-width: 768px) {
	.guestbook-page {
		padding: 1.25rem 0 0.75rem;
	}

	.guestbook-header {
		margin-bottom: 1.5rem;
	}

	.guestbook-title {
		font-size: 1.85rem;
	}
}
</style>
