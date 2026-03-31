<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md';
}>(), {
  size: 'sm'
});

const { theme, toggleTheme, initTheme } = useTheme();
const isMounted = ref(false);

onMounted(() => {
  initTheme();
  isMounted.value = true;
});

const label = computed(() => theme.value === 'dark' ? '切換為淺色主題' : '切換為深色主題');
</script>

<template>
  <button
    class="theme-toggle"
    :class="[`size-${props.size}`]"
    role="switch"
    :aria-checked="theme === 'dark'"
    :aria-label="label"
    @click="toggleTheme"
  >
    <span class="icons">
      <Icon name="heroicons:moon" size="14" class="icon moon" />
      <Icon name="heroicons:sun" size="14" class="icon sun" />
    </span>
    <span class="knob" />
  </button>
  <span v-if="!isMounted" style="display:none" />
  
</template>

<style scoped>
.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-slate-50) 70%, var(--color-bg-tertiary) 30%);
  border: 1px solid color-mix(in srgb, var(--color-slate-300) 70%, transparent);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: inset 0 1px 3px rgb(148 163 184 / 0.25);
}

.theme-toggle:hover {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 20%, var(--color-slate-50) 80%);
  box-shadow: 0 3px 8px rgb(14 165 233 / 0.18);
}

.icons {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  padding: 0 6px;
}

.icon {
  color: color-mix(in srgb, var(--color-text-tertiary) 65%, var(--color-slate-500) 35%);
}

.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  background: color-mix(in srgb, var(--color-bg-primary) 90%, var(--color-slate-50) 10%);
  border: 1px solid rgba(148, 163, 184, 0.55);
  border-radius: var(--radius-pill);
  transition: transform var(--transition-base), background-color var(--transition-base), border-color var(--transition-base);
  box-shadow: 0 2px 6px rgb(148 163 184 / 0.35);
}

/* Sizes */
.size-sm {
  width: 52px;
  height: 28px;
}
.size-sm .knob {
  width: 24px;
  height: 24px;
}
.size-sm[aria-checked="true"] .knob {
  transform: translateX(24px);
}

.size-md {
  width: 64px;
  height: 36px;
}
.size-md .knob {
  width: 32px;
  height: 32px;
}
.size-md[aria-checked="true"] .knob {
  transform: translateX(32px);
}

/* Active (dark) state -> make track and knob blue */
.theme-toggle[aria-checked="true"] {
  background: color-mix(in oklab, var(--color-primary) 40%, var(--color-cyan-100) 60%);
  border-color: color-mix(in srgb, var(--color-primary) 80%, var(--color-primary-light) 20%);
}

.theme-toggle[aria-checked="true"] .knob {
  border-color: color-mix(in srgb, var(--color-primary) 80%, var(--color-primary-light) 20%);
  background: color-mix(in srgb, var(--color-bg-primary) 75%, var(--color-primary) 25%);
  box-shadow: 0 4px 10px rgb(14 165 233 / 0.35);
}

.theme-toggle[aria-checked="true"] .sun {
  color: var(--color-primary);
}

.theme-toggle:not([aria-checked="true"]) .moon {
  color: var(--color-primary);
}

:global(.dark) .theme-toggle {
  background: color-mix(in srgb, var(--color-slate-900) 70%, var(--color-slate-800) 30%);
  border-color: color-mix(in srgb, var(--color-slate-800) 70%, var(--color-slate-600) 30%);
  box-shadow: inset 0 1px 2px rgb(15 23 42 / 0.6);
}

:global(.dark) .theme-toggle:hover {
  background: color-mix(in srgb, var(--color-primary) 25%, var(--color-slate-800) 75%);
  border-color: color-mix(in srgb, var(--color-primary) 65%, var(--color-slate-900) 35%);
}

:global(.dark) .theme-toggle .knob {
  background: color-mix(in srgb, var(--color-slate-50) 85%, var(--color-slate-200) 15%);
  border-color: color-mix(in srgb, var(--color-slate-400) 80%, transparent);
  box-shadow: 0 2px 6px rgb(15 23 42 / 0.55);
}

:global(.dark) .theme-toggle .icon {
  color: color-mix(in srgb, var(--color-slate-400) 65%, var(--color-slate-300) 35%);
}
</style>
