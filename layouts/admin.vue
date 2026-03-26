<template>
	<div class="admin-layout">
		<main class="admin-main">
			<slot />
		</main>
	</div>
</template>

<script setup lang="ts">
// Layout only: main content container.
</script>

<style scoped>
.admin-layout {
	min-height: calc(100vh - var(--header-height, 70px));
	padding: 1.5rem;
}

.admin-main {
	min-width: 0;
}
</style>
