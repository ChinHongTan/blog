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

import type { EditorToolbarApi } from "./MilkdownEditorInner.vue";

const emit = defineEmits<{
  ready: [api: EditorToolbarApi];
  markdownChange: [markdown: string];
}>();

export type { EditorToolbarApi } from "./MilkdownEditorInner.vue";

const editorLoading = ref(true);
let toolbarApi: EditorToolbarApi | null = null;

function onReady(api: EditorToolbarApi) {
  editorLoading.value = false;
  toolbarApi = api;
  emit("ready", api);
}

defineExpose({
  getMarkdown: () => toolbarApi?.getMarkdown() ?? "",
  setMarkdown: (markdown: string) => toolbarApi?.setMarkdown(markdown),
  undo: () => toolbarApi?.undo(),
  redo: () => toolbarApi?.redo(),
  wrapInHeading: (level: number) => toolbarApi?.wrapInHeading(level),
  toggleBold: () => toolbarApi?.toggleBold(),
  toggleItalic: () => toolbarApi?.toggleItalic(),
  toggleStrikethrough: () => toolbarApi?.toggleStrikethrough(),
  toggleLink: () => toolbarApi?.toggleLink(),
  toggleInlineCode: () => toolbarApi?.toggleInlineCode(),
  insertImage: (payload) => toolbarApi?.insertImage(payload),
  insertImageBlock: () => toolbarApi?.insertImageBlock(),
  getActiveFormatting: () => toolbarApi?.getActiveFormatting() ?? { bold: false, italic: false, strikethrough: false },
  wrapInBlockquote: () => toolbarApi?.wrapInBlockquote(),
  insertInfoBox: (kind) => toolbarApi?.insertInfoBox(kind),
  insertTable: () => toolbarApi?.insertTable(),
  wrapInBulletList: () => toolbarApi?.wrapInBulletList(),
  wrapInOrderedList: () => toolbarApi?.wrapInOrderedList(),
  wrapInTaskList: () => toolbarApi?.wrapInTaskList(),
  insertHr: () => toolbarApi?.insertHr(),
  insertCodeBlock: (language?: string) => toolbarApi?.insertCodeBlock(language),
  insertMathBlock: () => toolbarApi?.insertMathBlock(),
  applyTextColor: (className: string) => toolbarApi?.applyTextColor(className),
  getActiveTextColor: () => toolbarApi?.getActiveTextColor() ?? null,
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
