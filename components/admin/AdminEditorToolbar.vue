<template>
  <div
    class="admin-editor-toolbar-inner"
    @mousedown="onToolbarMouseDown"
    @mouseover="onToolbarMouseOver"
    @mouseout="onToolbarMouseOut"
  >
    <!-- Undo, Redo -->
    <button type="button" class="admin-toolbar-btn" data-tooltip="復原" aria-label="復原" @click="api?.undo?.()">
      <Icon name="heroicons:arrow-uturn-left" size="18" />
    </button>
    <button type="button" class="admin-toolbar-btn" data-tooltip="重做" aria-label="重做" @click="api?.redo?.()">
      <Icon name="heroicons:arrow-uturn-right" size="18" />
    </button>
    <span class="admin-toolbar-sep" aria-hidden="true" />

    <!-- H2, H3: numerals so they look distinct -->
    <button type="button" class="admin-toolbar-btn admin-toolbar-btn-num" data-tooltip="標題 2" aria-label="標題 2" @click="api?.wrapInHeading?.(2)">
      <span>2</span>
    </button>
    <button type="button" class="admin-toolbar-btn admin-toolbar-btn-num" data-tooltip="標題 3" aria-label="標題 3" @click="api?.wrapInHeading?.(3)">
      <span>3</span>
    </button>
    <!-- Hn dropdown: 4, 5, 6 (no tooltip on parent) -->
    <div
      class="admin-toolbar-dropdown-wrap"
      @mouseenter="enterDropdown('hn')"
      @mouseleave="scheduleCloseDropdown"
    >
      <button type="button" class="admin-toolbar-btn admin-toolbar-btn-num">
        <span>Hn</span>
        <Icon name="heroicons:chevron-down" size="12" class="admin-toolbar-chevron" />
      </button>
      <div v-show="openDropdown === 'hn'" class="admin-toolbar-dropdown admin-toolbar-dropdown-row" role="menu">
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="標題 4" aria-label="標題 4" role="menuitem" @click="api?.wrapInHeading?.(4); openDropdown = null">
          <span>4</span>
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="標題 5" aria-label="標題 5" role="menuitem" @click="api?.wrapInHeading?.(5); openDropdown = null">
          <span>5</span>
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="標題 6" aria-label="標題 6" role="menuitem" @click="api?.wrapInHeading?.(6); openDropdown = null">
          <span>6</span>
        </button>
      </div>
    </div>

    <span class="admin-toolbar-sep" aria-hidden="true" />

    <!-- Bold, Italic, Strikethrough (active state when selection has that mark) -->
    <button type="button" class="admin-toolbar-btn" :class="{ 'admin-toolbar-btn-active': activeFormatting?.bold }" data-tooltip="粗體" aria-label="粗體" @click="api?.toggleBold?.()">
      <Icon name="heroicons:bold" size="18" />
    </button>
    <button type="button" class="admin-toolbar-btn" :class="{ 'admin-toolbar-btn-active': activeFormatting?.italic }" data-tooltip="斜體" aria-label="斜體" @click="api?.toggleItalic?.()">
      <Icon name="heroicons:italic" size="18" />
    </button>
    <button type="button" class="admin-toolbar-btn" :class="{ 'admin-toolbar-btn-active': activeFormatting?.strikethrough }" data-tooltip="刪除線" aria-label="刪除線" @click="api?.toggleStrikethrough?.()">
      <Icon name="heroicons:strikethrough" size="18" />
    </button>
    <!-- Underline: not supported in Markdown -->
    <button type="button" class="admin-toolbar-btn" data-tooltip="底線（Markdown 不支援）" aria-label="底線（Markdown 不支援）" disabled>
      <Icon name="heroicons:underline" size="18" />
    </button>
    <!-- Highlight: not supported -->
    <button type="button" class="admin-toolbar-btn" data-tooltip="螢光（Markdown 不支援）" aria-label="螢光（Markdown 不支援）" disabled>
      <Icon name="heroicons:paint-brush" size="18" />
    </button>

    <span class="admin-toolbar-sep" aria-hidden="true" />

    <!-- Image: insert image block (same as slash) so user can upload in place -->
    <button type="button" class="admin-toolbar-btn" data-tooltip="插入圖片" aria-label="插入圖片" @click="api?.insertImageBlock?.()">
      <Icon name="heroicons:photo" size="18" />
    </button>
    <!-- Table -->
    <button type="button" class="admin-toolbar-btn" data-tooltip="插入表格" aria-label="插入表格" @click="api?.insertTable?.()">
      <Icon name="heroicons:table-cells" size="18" />
    </button>

    <!-- Quote & Callout group (no tooltip on parent) -->
    <div
      class="admin-toolbar-dropdown-wrap"
      @mouseenter="enterDropdown('quote')"
      @mouseleave="scheduleCloseDropdown"
    >
      <button type="button" class="admin-toolbar-btn">
        <Icon name="heroicons:chat-bubble-left" size="18" />
        <Icon name="heroicons:chevron-down" size="12" class="admin-toolbar-chevron" />
      </button>
      <div v-show="openDropdown === 'quote'" class="admin-toolbar-dropdown admin-toolbar-dropdown-row" role="menu">
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="引用" aria-label="引用" role="menuitem" @click="api?.wrapInBlockquote?.(); openDropdown = null">
          <Icon name="heroicons:chat-bubble-left" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="資訊框" aria-label="資訊框" role="menuitem" @click="api?.insertInfoBox?.('info'); openDropdown = null">
          <Icon name="heroicons:information-circle" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="警告框" aria-label="警告框" role="menuitem" @click="api?.insertInfoBox?.('warning'); openDropdown = null">
          <Icon name="heroicons:exclamation-triangle" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="成功框" aria-label="成功框" role="menuitem" @click="api?.insertInfoBox?.('success'); openDropdown = null">
          <Icon name="heroicons:check-circle" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="錯誤框" aria-label="錯誤框" role="menuitem" @click="api?.insertInfoBox?.('error'); openDropdown = null">
          <Icon name="heroicons:x-circle" size="18" />
        </button>
      </div>
    </div>

    <!-- Advanced: math, code, link, divider (no tooltip on parent) -->
    <div
      class="admin-toolbar-dropdown-wrap"
      @mouseenter="enterDropdown('advanced')"
      @mouseleave="scheduleCloseDropdown"
    >
      <button type="button" class="admin-toolbar-btn">
        <Icon name="heroicons:wrench-screwdriver" size="18" />
        <Icon name="heroicons:chevron-down" size="12" class="admin-toolbar-chevron" />
      </button>
      <div v-show="openDropdown === 'advanced'" class="admin-toolbar-dropdown admin-toolbar-dropdown-row" role="menu">
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="數學公式" aria-label="數學公式" role="menuitem" @click="api?.insertMathBlock?.(); openDropdown = null">
          <Icon name="heroicons:variable" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="程式碼區塊" aria-label="程式碼區塊" role="menuitem" @click="api?.insertCodeBlock?.(); openDropdown = null">
          <Icon name="heroicons:code-bracket-square" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="行內程式碼" aria-label="行內程式碼" role="menuitem" @click="api?.toggleInlineCode?.(); openDropdown = null">
          <Icon name="heroicons:command-line" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="連結" aria-label="連結" role="menuitem" @click="api?.toggleLink?.(); openDropdown = null">
          <Icon name="heroicons:link" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="水平分隔線" aria-label="水平分隔線" role="menuitem" @click="api?.insertHr?.(); openDropdown = null">
          <Icon name="heroicons:minus" size="18" />
        </button>
      </div>
    </div>

    <!-- Lists: checklist, numbered, bullet (no tooltip on parent) -->
    <div
      class="admin-toolbar-dropdown-wrap"
      @mouseenter="enterDropdown('lists')"
      @mouseleave="scheduleCloseDropdown"
    >
      <button type="button" class="admin-toolbar-btn">
        <Icon name="heroicons:list-bullet" size="18" />
        <Icon name="heroicons:chevron-down" size="12" class="admin-toolbar-chevron" />
      </button>
      <div v-show="openDropdown === 'lists'" class="admin-toolbar-dropdown admin-toolbar-dropdown-row" role="menu">
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="待辦列表" aria-label="待辦列表" role="menuitem" @click="api?.wrapInTaskList?.(); openDropdown = null">
          <Icon name="heroicons:check-circle" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="有序列表" aria-label="有序列表" role="menuitem" @click="api?.wrapInOrderedList?.(); openDropdown = null">
          <Icon name="heroicons:numbered-list" size="18" />
        </button>
        <button type="button" class="admin-toolbar-btn admin-toolbar-dropdown-icon" data-tooltip="無序列表" aria-label="無序列表" role="menuitem" @click="api?.wrapInBulletList?.(); openDropdown = null">
          <Icon name="heroicons:list-bullet" size="18" />
        </button>
      </div>
    </div>

    <!-- Font colors: colour table (preset swatches) -->
    <div
      class="admin-toolbar-dropdown-wrap"
      @mouseenter="enterDropdown('fontColor')"
      @mouseleave="scheduleCloseDropdown"
    >
      <button type="button" class="admin-toolbar-btn" data-tooltip="文字顏色" aria-label="文字顏色" @mousedown.prevent>
        <Icon name="heroicons:swatch" size="18" />
        <Icon name="heroicons:chevron-down" size="12" class="admin-toolbar-chevron" />
      </button>
      <div v-show="openDropdown === 'fontColor'" class="admin-toolbar-dropdown admin-toolbar-dropdown-colors" role="menu">
        <div v-for="row in editorColorRows" :key="row.hue" class="admin-toolbar-color-row">
          <button
            v-for="preset in row.presets"
            :key="preset.class"
            type="button"
            class="admin-toolbar-color-swatch"
            :class="{ 'admin-toolbar-color-swatch-active': activeTextColor === preset.class }"
            :style="{ backgroundColor: preset.hex }"
            :title="preset.label ?? preset.class"
            :aria-label="preset.label ?? preset.class"
            @mousedown.prevent
            @click="api?.applyTextColor?.(preset.class)"
          />
        </div>
      </div>
    </div>

    <!-- Font background: not supported (no tooltip on parent) -->
    <div
      class="admin-toolbar-dropdown-wrap"
      @mouseenter="enterDropdown('fontBg')"
      @mouseleave="scheduleCloseDropdown"
    >
      <button type="button" class="admin-toolbar-btn" disabled>
        <Icon name="heroicons:square-2-stack" size="18" />
        <Icon name="heroicons:chevron-down" size="12" class="admin-toolbar-chevron" />
      </button>
      <div v-show="openDropdown === 'fontBg'" class="admin-toolbar-dropdown admin-toolbar-dropdown-row" role="menu">
        <span class="admin-toolbar-dropdown-hint">Markdown 不支援背景色</span>
      </div>
    </div>

    <!-- Custom quick tooltip (short delay) -->
    <Teleport to="body">
      <Transition name="admin-tooltip">
        <div
          v-show="tooltipVisible && tooltipText"
          class="admin-toolbar-custom-tooltip"
          :style="tooltipStyle"
          role="tooltip"
        >
          {{ tooltipText }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { EditorToolbarApi } from "./MilkdownEditorInner.vue";
import { EDITOR_COLOR_ROWS } from "~/lib/editor-colors";

const props = defineProps<{
  api: EditorToolbarApi | null;
}>();

const openDropdown = ref<"hn" | "quote" | "advanced" | "lists" | "fontColor" | "fontBg" | null>(null);

const editorColorRows = EDITOR_COLOR_ROWS;

const activeFormatting = ref<{ bold: boolean; italic: boolean; strikethrough: boolean }>({
  bold: false,
  italic: false,
  strikethrough: false,
});

const activeTextColor = ref<string | null>(null);

const ACTIVE_POLL_INTERVAL_MS = 200;
let activePollTimer: ReturnType<typeof setInterval> | null = null;

function pollActiveFormatting() {
  const next = props.api?.getActiveFormatting?.();
  if (next) activeFormatting.value = next;
  const color = props.api?.getActiveTextColor?.();
  activeTextColor.value = color ?? null;
}

onMounted(() => {
  activePollTimer = setInterval(pollActiveFormatting, ACTIVE_POLL_INTERVAL_MS);
});

const DROPDOWN_CLOSE_DELAY_MS = 500;
let dropdownCloseTimer: ReturnType<typeof setTimeout> | null = null;

function enterDropdown(key: NonNullable<typeof openDropdown.value>) {
  if (dropdownCloseTimer) {
    clearTimeout(dropdownCloseTimer);
    dropdownCloseTimer = null;
  }
  openDropdown.value = key;
}

function scheduleCloseDropdown() {
  if (dropdownCloseTimer) clearTimeout(dropdownCloseTimer);
  dropdownCloseTimer = setTimeout(() => {
    openDropdown.value = null;
    dropdownCloseTimer = null;
  }, DROPDOWN_CLOSE_DELAY_MS);
}

const TOOLTIP_DELAY_MS = 300;
let tooltipShowTimer: ReturnType<typeof setTimeout> | null = null;
const tooltipVisible = ref(false);
const tooltipText = ref("");
const tooltipStyle = ref<{ left: string; top: string }>({ left: "0", top: "0" });

function getTooltipText(el: EventTarget | null): string {
  const target = el as HTMLElement | null;
  const btn = target?.closest?.("button[data-tooltip]") as HTMLButtonElement | null;
  return btn?.getAttribute("data-tooltip") ?? "";
}

function showTooltip(el: EventTarget | null) {
  const target = el as HTMLElement | null;
  const btn = target?.closest?.("button[data-tooltip]") as HTMLButtonElement | null;
  if (!btn) return;
  const text = btn.getAttribute("data-tooltip");
  if (!text) return;
  const rect = btn.getBoundingClientRect();
  tooltipText.value = text;
  tooltipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.bottom + 6}px`,
  };
  tooltipVisible.value = true;
}

/** Prevent toolbar buttons from taking focus so editor selection is preserved. */
function onToolbarMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest("button")) {
    e.preventDefault();
  }
}

function onToolbarMouseOver(e: MouseEvent) {
  const text = getTooltipText(e.target);
  if (!text) return;
  if (tooltipShowTimer) clearTimeout(tooltipShowTimer);
  tooltipShowTimer = setTimeout(() => {
    showTooltip(e.target);
    tooltipShowTimer = null;
  }, TOOLTIP_DELAY_MS);
}

function onToolbarMouseOut() {
  if (tooltipShowTimer) {
    clearTimeout(tooltipShowTimer);
    tooltipShowTimer = null;
  }
  tooltipVisible.value = false;
}

onBeforeUnmount(() => {
  if (dropdownCloseTimer) clearTimeout(dropdownCloseTimer);
  if (tooltipShowTimer) clearTimeout(tooltipShowTimer);
  if (activePollTimer) clearInterval(activePollTimer);
});
</script>

<style scoped>
.admin-editor-toolbar-inner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.15rem;
  justify-content: center;
}
.admin-toolbar-sep {
  width: 1px;
  height: 1.25rem;
  background: var(--color-border-light);
  margin: 0 0.1rem;
}
.admin-toolbar-chevron {
  margin-left: 0.1rem;
  opacity: 0.8;
}
.admin-toolbar-dropdown-wrap {
  position: relative;
  display: inline-flex;
}
.admin-toolbar-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.2rem;
  min-width: 10rem;
  padding: 0.35rem;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.admin-toolbar-dropdown-row {
  flex-direction: row;
  align-items: center;
  gap: 0.2rem;
  min-width: auto;
}
.admin-toolbar-dropdown-colors {
  flex-direction: column;
  gap: 0.2rem;
  min-width: 10rem;
}
.admin-toolbar-color-row {
  display: flex;
  flex-direction: row;
  gap: 0.2rem;
}
.admin-toolbar-color-swatch {
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--color-border-light);
  border-radius: 0.25rem;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}
.admin-toolbar-color-swatch:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-sm);
}
.admin-toolbar-color-swatch-active {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
.admin-toolbar-dropdown-icon {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.admin-toolbar-btn-num span {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
}
.admin-toolbar-btn-active {
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  color: var(--color-primary);
}
.admin-toolbar-btn-active:hover {
  background: color-mix(in srgb, var(--color-primary) 28%, transparent);
  color: var(--color-primary);
}
.admin-toolbar-dropdown-hint {
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

/* Custom quick tooltip (not scoped so Teleport works) */
.admin-toolbar-custom-tooltip {
  position: fixed;
  transform: translate(-50%, 0);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 0.35rem;
  box-shadow: var(--shadow-md);
  z-index: 9999;
  pointer-events: none;
  white-space: nowrap;
}
.admin-tooltip-enter-active,
.admin-tooltip-leave-active {
  transition: opacity 0.1s ease;
}
.admin-tooltip-enter-from,
.admin-tooltip-leave-to {
  opacity: 0;
}
</style>
