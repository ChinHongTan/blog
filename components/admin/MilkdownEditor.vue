<template>
  <div class="milkdown-editor-wrap">
    <MilkdownProvider>
      <div v-if="editorLoading" class="milkdown-loading">載入編輯器…</div>
      <AdminMilkdownEditorInner
        v-show="!editorLoading"
        :default-value="defaultValue"
        @ready="onReady"
        @markdown-change="emit('markdownChange', $event)"
      />
    </MilkdownProvider>
  </div>
</template>

<script setup lang="ts">
import { MilkdownProvider } from "@milkdown/vue";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/nord.css";
import { ref } from "vue";

withDefaults(
  defineProps<{
    defaultValue?: string;
  }>(),
  { defaultValue: "" }
);

const emit = defineEmits<{
  ready: [api: { getMarkdown: () => string; setMarkdown: (markdown: string) => void }];
  markdownChange: [markdown: string];
}>();

const editorLoading = ref(true);
let getMarkdownFn: (() => string) | null = null;
let setMarkdownFn: ((markdown: string) => void) | null = null;

function onReady(api: { getMarkdown: () => string; setMarkdown: (markdown: string) => void }) {
  editorLoading.value = false;
  getMarkdownFn = api.getMarkdown;
  setMarkdownFn = api.setMarkdown;
  emit("ready", api);
}

defineExpose({
  getMarkdown: () => getMarkdownFn?.() ?? "",
  setMarkdown: (markdown: string) => setMarkdownFn?.(markdown),
});
</script>

<style scoped>
.milkdown-editor-wrap {
  position: relative;
  min-height: 50vh;
  display: block;
}
.milkdown-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}
.milkdown-editor-wrap :deep([data-milkdown-root]) {
  min-height: 50vh;
  padding: 0;
  background: transparent;
  border: none;
  overflow: visible;
}
</style>
