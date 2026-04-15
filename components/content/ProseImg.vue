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
	<NuxtImg
		:src="props.src"
		:alt="props.alt"
		:title="props.title"
		:width="props.width"
		:height="props.height"
		sizes="sm:100vw md:720px lg:800px"
		format="webp"
		loading="lazy"
		decoding="async"
	/>
</template>
