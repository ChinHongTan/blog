<script setup lang="ts">
import { computed } from "vue";

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
	},
);

const parsedAlt = computed(() => {
	// Matches pure decimal numbers (e.g., "0.86" or ".5") at the start of the alt text
	const match = props.alt?.match(/^(\d*\.\d+)\s*(.*)$/);
	if (match) {
		return {
			scale: parseFloat(match[1]),
			altText: match[2],
		};
	}
	return {
		scale: 1,
		altText: props.alt,
	};
});

const imageStyle = computed(() => {
	return {
		display: "block",
		margin: "2rem auto",
		width:
			parsedAlt.value.scale !== 1
				? `${parsedAlt.value.scale * 100}%`
				: "auto",
		maxWidth: "100%",
		height: "auto",
	};
});
</script>

<template>
	<NuxtImg
		:src="props.src"
		:alt="parsedAlt.altText"
		:title="props.title"
		:width="props.width"
		:height="props.height"
		:style="imageStyle"
		sizes="sm:100vw md:720px lg:800px"
		format="webp"
		loading="lazy"
		decoding="async"
	/>
</template>
