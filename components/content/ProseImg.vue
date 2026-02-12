<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		src?: string;
		alt?: string;
		title?: string;
		width?: string | number;
		height?: string | number;
	}>(),
	{
		src: "",
		alt: "",
		title: undefined,
		width: undefined,
		height: undefined,
	}
);
</script>

<template>
	<img
		:src="props.src"
		:alt="props.alt"
		:title="props.title"
		:width="props.width"
		:height="props.height"
		loading="lazy"
		decoding="async"
	>
</template>
