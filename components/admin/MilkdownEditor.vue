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
import type { EditorToolbarApi } from "./MilkdownEditorInner.vue";

withDefaults(
  defineProps<{
    defaultValue?: string;
  }>(),
  { defaultValue: "" }
);

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
  getActiveHeadingLevel: () => toolbarApi?.getActiveHeadingLevel() ?? 0,
  setBlockTypeToParagraph: () => toolbarApi?.setBlockTypeToParagraph(),
  toggleBold: () => toolbarApi?.toggleBold(),
  toggleItalic: () => toolbarApi?.toggleItalic(),
  toggleStrikethrough: () => toolbarApi?.toggleStrikethrough(),
  toggleLink: () => toolbarApi?.toggleLink(),
  toggleInlineCode: () => toolbarApi?.toggleInlineCode(),
  insertImage: (payload?: { src?: string; alt?: string; title?: string }) => toolbarApi?.insertImage(payload),
  insertImageBlock: () => toolbarApi?.insertImageBlock(),
  getActiveFormatting: () => toolbarApi?.getActiveFormatting() ?? { bold: false, italic: false, strikethrough: false },
  wrapInBlockquote: () => toolbarApi?.wrapInBlockquote(),
  insertInfoBox: (kind: "info" | "success" | "warning" | "error") => toolbarApi?.insertInfoBox(kind),
  insertTable: () => toolbarApi?.insertTable(),
  wrapInBulletList: () => toolbarApi?.wrapInBulletList(),
  wrapInOrderedList: () => toolbarApi?.wrapInOrderedList(),
  wrapInTaskList: () => toolbarApi?.wrapInTaskList(),
  insertHr: () => toolbarApi?.insertHr(),
  insertCodeBlock: (language?: string) => toolbarApi?.insertCodeBlock(language),
  insertMathBlock: () => toolbarApi?.insertMathBlock(),
  insertCustomHtmlBlock: () => toolbarApi?.insertCustomHtmlBlock(),
  applyTextColor: (className: string) => toolbarApi?.applyTextColor(className),
  removeTextColor: (className?: string) => toolbarApi?.removeTextColor(className),
  getActiveTextColors: () => toolbarApi?.getActiveTextColors() ?? [],
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

.milkdown-editor-wrap :deep(.custom-html-editor-block) {
  position: relative;
  margin: 1rem 0;
  border: 1px solid var(--color-border-tertiary, #e5e5e5);
  border-radius: var(--border-radius-md, 8px);
  background: var(--color-bg-secondary, #f8f8f8);
  overflow: hidden;
  user-select: none;
}
.milkdown-editor-wrap :deep(.custom-html-editor-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--color-bg-tertiary, #eee);
  border-bottom: 1px solid var(--color-border-tertiary, #e5e5e5);
  font-size: 12px;
  color: var(--color-text-secondary, #666);
}
.milkdown-editor-wrap :deep(.custom-html-editor-label) {
  font-weight: 500;
  letter-spacing: 0.02em;
}
.milkdown-editor-wrap :deep(.custom-html-editor-toggle) {
  padding: 2px 10px;
  font-size: 12px;
  border: 1px solid var(--color-border-tertiary, #e5e5e5);
  border-radius: 4px;
  background: var(--color-bg-primary, #fff);
  color: var(--color-text-secondary, #666);
  cursor: pointer;
  user-select: none;
}
.milkdown-editor-wrap :deep(.custom-html-editor-toggle:hover) {
  background: var(--color-bg-tertiary, #eee);
  color: var(--color-text-primary, #111);
}
.milkdown-editor-wrap :deep(.custom-html-editor-code) {
  padding: 0;
  background: var(--color-bg-primary, #fff);
  border-bottom: 1px solid var(--color-border-tertiary, #e5e5e5);
}
.milkdown-editor-wrap :deep(.custom-html-editor-textarea) {
  width: 100%;
  min-height: 120px;
  max-height: 400px;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: var(--color-text-primary, #111);
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  user-select: text;
  white-space: pre;
  overflow: auto;
}

/* CodeMirror overrides */
.milkdown-editor-wrap :deep(.custom-html-editor-code .cm-editor) {
  width: 100%;
  min-height: 120px;
  max-height: 400px;
  background: transparent !important;
  color: var(--color-text-primary, #111);
  font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
}
.milkdown-editor-wrap :deep(.custom-html-editor-code .cm-scroller) {
  font-family: inherit;
  overflow: auto;
  max-height: 400px;
}

/* Expanded fullscreen view */
.milkdown-editor-wrap :deep(.custom-html-editor-block.custom-html-editor-expanded) {
  position: fixed;
  inset: 0;
  top: var(--header-height, 70px);
  z-index: 90; /* Keep it below the header (z-index: 100) but above everything else */
  background: var(--color-bg-secondary, #f8f8f8);
  border-radius: 0;
  border: none;
  margin: 0;
  display: flex !important;
  flex-direction: column;
}
.milkdown-editor-wrap :deep(.custom-html-editor-expanded .custom-html-editor-header) {
  padding: 12px 16px;
  font-size: 14px;
}
.milkdown-editor-wrap :deep(.custom-html-editor-expanded .custom-html-editor-code) {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
}
.milkdown-editor-wrap :deep(.custom-html-editor-expanded .cm-editor) {
  max-height: none;
  height: 100%;
}
.milkdown-editor-wrap :deep(.custom-html-editor-expanded .cm-scroller) {
  max-height: none;
}
.milkdown-editor-wrap :deep(.custom-html-editor-expanded .custom-html-editor-preview) {
  flex: 1;
  height: 0;
  overflow: auto;
  border-top: 1px solid var(--color-border-tertiary, #e5e5e5);
}
.milkdown-editor-wrap :deep(.custom-html-editor-expanded .custom-html-editor-preview iframe) {
  height: 100% !important;
}
.milkdown-editor-wrap :deep(.custom-html-editor-preview) {
  padding: 0;
  background: var(--color-bg-primary, #fff);
}
.milkdown-editor-wrap :deep(.custom-html-editor-preview iframe) {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
}
.milkdown-editor-wrap :deep(.custom-html-editor-collapsed .custom-html-editor-code) {
  display: none;
}
.milkdown-editor-wrap :deep(.custom-html-editor-error) {
  padding: 8px 12px;
  font-size: 12px;
  color: #c0392b;
  background: color-mix(in srgb, #c0392b 8%, transparent);
  border-top: 1px solid color-mix(in srgb, #c0392b 20%, transparent);
}
</style>
