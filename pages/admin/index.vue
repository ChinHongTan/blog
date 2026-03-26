<template>
	<div />
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin" });
await navigateTo("/admin/posts", { replace: true });
</script>
