<template>
  <div class="milkdown-editor-wrap">
    <MilkdownProvider>
      <div v-if="editorLoading" class="milkdown-loading">載入編輯器…</div>
      <AdminMilkdownEditorInner
        v-show="!editorLoading"
        :default-value="defaultValue"
        @ready="onReady"
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
  ready: [api: { getMarkdown: () => string }];
}>();

const editorLoading = ref(true);
let getMarkdownFn: (() => string) | null = null;

function onReady(api: { getMarkdown: () => string }) {
  editorLoading.value = false;
  getMarkdownFn = api.getMarkdown;
  emit("ready", api);
}

defineExpose({
  getMarkdown: () => getMarkdownFn?.() ?? "",
});
</script>

<style scoped>
.milkdown-editor-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  min-height: 0;
  padding: 0;
  background: transparent;
  border: none;
}
</style>
