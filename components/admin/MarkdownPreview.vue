<template>
  <!-- eslint-disable-next-line vue/no-v-html -- renderedHtml is from marked + katex, not user input -->
  <div class="markdown-preview prose-preview" v-html="renderedHtml" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";
import katex from "katex";

const props = defineProps<{
  source: string;
}>();

// Render LaTeX in text: $...$ and $$...$$
function renderMath(html: string): string {
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineRegex = /\$([^$\n]+)\$/g;
  let out = html;
  out = out.replace(blockRegex, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<span class="katex-error">${escapeHtml(math)}</span>`;
    }
  });
  out = out.replace(inlineRegex, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="katex-error">${escapeHtml(math)}</span>`;
    }
  });
  return out;
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

const renderedHtml = computed(() => {
  const raw = marked.parse(props.source, { async: false }) as string;
  return renderMath(raw || "");
});
</script>

<style scoped>
.markdown-preview {
  padding: 0.75rem 1rem;
  min-height: 200px;
  overflow: auto;
}
.prose-preview :deep(h1) { font-size: 1.5rem; margin: 0.75rem 0; }
.prose-preview :deep(h2) { font-size: 1.25rem; margin: 0.5rem 0; }
.prose-preview :deep(h3) { font-size: 1.125rem; margin: 0.5rem 0; }
.prose-preview :deep(p) { margin: 0.5rem 0; }
.prose-preview :deep(ul), .prose-preview :deep(ol) { margin: 0.5rem 0; padding-left: 1.5rem; }
.prose-preview :deep(blockquote) { border-left: 4px solid var(--color-border-medium); padding-left: 1rem; margin: 0.5rem 0; color: var(--color-text-secondary); }
.prose-preview :deep(pre) { background: var(--color-bg-tertiary); padding: 0.75rem; border-radius: 0.375rem; overflow: auto; }
.prose-preview :deep(code) { font-family: var(--font-mono); font-size: 0.875em; background: var(--color-bg-tertiary); padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
.prose-preview :deep(pre code) { background: none; padding: 0; }
.prose-preview :deep(img) { max-width: 100%; height: auto; }
.prose-preview :deep(.katex) { font-size: 1.1em; }
.prose-preview :deep(.katex-display) { margin: 0.75rem 0; overflow: auto; }
</style>
