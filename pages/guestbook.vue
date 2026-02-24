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

onMounted(() => {
	initWaline({
		el: "#guestbook-waline",
		serverURL: "https://waline.chinono.dev",
		path: "/guestbook",
		lang: "zh-TW",
		dark: "html.dark",
	});
});
</script>

<template>
	<div class="guestbook-page">
		<header class="guestbook-header">
			<h1 class="guestbook-title">留言板</h1>
			<p class="guestbook-subtitle">可以在這裡留言或者聊天～</p>
		</header>
		<div class="guestbook-waline-wrap">
			<div id="guestbook-waline" />
		</div>
	</div>
</template>

<style scoped>
.guestbook-page {
	max-width: 720px;
	margin: 0 auto;
	padding: 1rem 0;
}

.guestbook-header {
	text-align: center;
	margin-bottom: 2rem;
}

.guestbook-title {
	font-size: 2rem;
	font-weight: 700;
	margin: 0 0 0.5rem;
}

.guestbook-subtitle {
	color: var(--color-text-secondary);
	font-size: 1rem;
	margin: 0;
}

.guestbook-waline-wrap {
	min-height: 300px;
}
</style>
