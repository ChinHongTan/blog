<script setup lang="ts">
import { Cropper, type CropperResult } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import BaseModal from "~/components/ui/BaseModal.vue";

const props = withDefaults(
	defineProps<{
		modelValue: boolean;
		file: File | null;
		aspectRatio?: number;
		outputType?: string;
		outputQuality?: number;
	}>(),
	{
		aspectRatio: 16 / 7,
		outputType: "image/webp",
		outputQuality: 0.9,
	},
);

const emit = defineEmits<{
	(e: "update:modelValue", value: boolean): void;
	(e: "confirm", file: File): void;
	(e: "cancel"): void;
}>();

const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);
const src = ref<string>("");
const processing = ref(false);
let currentObjectUrl: string | null = null;

function revokeUrl() {
	if (currentObjectUrl) {
		URL.revokeObjectURL(currentObjectUrl);
		currentObjectUrl = null;
	}
}

watch(
	() => props.file,
	(file) => {
		revokeUrl();
		if (file) {
			currentObjectUrl = URL.createObjectURL(file);
			src.value = currentObjectUrl;
		} else {
			src.value = "";
		}
	},
	{ immediate: true },
);

onBeforeUnmount(revokeUrl);

const stencilProps = computed(() => ({
	aspectRatio: props.aspectRatio,
}));

function close() {
	emit("update:modelValue", false);
}

function onCancel() {
	emit("cancel");
	close();
}

function onConfirm() {
	const cropper = cropperRef.value;
	if (!cropper || !props.file) return;
	const result = cropper.getResult() as CropperResult;
	const canvas = result.canvas;
	if (!canvas) return;

	processing.value = true;
	canvas.toBlob(
		(blob) => {
			processing.value = false;
			if (!blob) return;
			const ext =
				props.outputType === "image/webp"
					? "webp"
					: props.outputType.split("/")[1] || "jpg";
			const originalName = props.file?.name ?? "cover";
			const base = originalName.replace(/\.[^.]+$/, "");
			const cropped = new File([blob], `${base}.${ext}`, {
				type: props.outputType,
			});
			emit("confirm", cropped);
			close();
		},
		props.outputType,
		props.outputQuality,
	);
}
</script>

<template>
	<BaseModal
		:model-value="modelValue"
		title="裁切封面圖片"
		description="拖曳移動，滾動或捏合縮放。選取的區域將成為封面圖。"
		width="lg"
		:close-on-backdrop="false"
		@update:model-value="(v) => (v ? null : onCancel())"
	>
		<div class="image-cropper-body">
			<div v-if="src" class="image-cropper-stage">
				<Cropper
					ref="cropperRef"
					class="image-cropper-instance"
					:src="src"
					:stencil-props="stencilProps"
					image-restriction="fit-area"
					:auto-zoom="true"
					background-class="image-cropper-bg"
					foreground-class="image-cropper-fg"
				/>
			</div>
			<p class="image-cropper-hint">
				拖曳圖片以移動位置，滾輪或捏合調整大小。預設輸出為 16:7
				封面比例。
			</p>
		</div>

		<template #actions>
			<button
				type="button"
				class="ui-btn ui-btn-ghost"
				:disabled="processing"
				@click="onCancel"
			>
				取消
			</button>
			<button
				type="button"
				class="ui-btn ui-btn-primary"
				:disabled="processing || !src"
				@click="onConfirm"
			>
				{{ processing ? "處理中…" : "套用裁切" }}
			</button>
		</template>
	</BaseModal>
</template>

<style scoped>
.image-cropper-body {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.image-cropper-stage {
	width: 100%;
	aspect-ratio: 16 / 9;
	max-height: 60vh;
	background: #111;
	border-radius: var(--radius-md);
	overflow: hidden;
}

.image-cropper-instance {
	width: 100%;
	height: 100%;
}

.image-cropper-hint {
	margin: 0;
	font-size: 0.8125rem;
	color: var(--color-text-secondary);
	line-height: 1.4;
}
</style>

<style>
.image-cropper-bg {
	background: #111;
}

.image-cropper-fg {
	background: rgba(0, 0, 0, 0.6);
}
</style>
