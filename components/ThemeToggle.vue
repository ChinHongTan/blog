<script setup lang="ts">
const STORAGE_KEY = 'theme';
type Theme = 'light' | 'dark';

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md';
}>(), {
  size: 'sm'
});

const current = ref<Theme>('light');
const isMounted = ref(false);

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
};

const setTheme = (theme: Theme) => {
  current.value = theme;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }
};

const toggle = () => setTheme(current.value === 'dark' ? 'light' as Theme : 'dark');

onMounted(() => {
  // Determine initial theme: saved -> system -> light
  let initial: Theme = 'light';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') initial = saved;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) initial = 'dark';
  } catch {
    // ignore
  }
  setTheme(initial);
  isMounted.value = true;
});

const label = computed(() => current.value === 'dark' ? '切換為淺色主題' : '切換為深色主題');
</script>

<template>
  <button
    class="theme-toggle"
    :class="[`size-${props.size}`]"
    role="switch"
    :aria-checked="current === 'dark'"
    :aria-label="label"
    @click="toggle"
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
  background: color-mix(in srgb, var(--color-bg-tertiary) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 2px rgb(15 23 42 / 0.08);
}

.theme-toggle:hover {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 18%, var(--color-bg-tertiary));
  box-shadow: var(--shadow-sm);
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
  color: color-mix(in srgb, var(--color-text-tertiary) 80%, transparent);
}

.knob {
  position: absolute;
  top: 2px;
  left: 2px;
  background: color-mix(in srgb, var(--color-bg-primary) 85%, #ffffff 15%);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
  border-radius: 9999px;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  box-shadow: var(--shadow-sm);
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
  background: color-mix(in oklab, var(--color-primary) 25%, transparent);
  border-color: var(--color-primary);
}

.theme-toggle[aria-checked="true"] .knob {
  border-color: var(--color-primary);
}

.theme-toggle[aria-checked="true"] .sun {
  color: var(--color-primary);
}

.theme-toggle:not([aria-checked="true"]) .moon {
  color: var(--color-primary);
}

:global(.dark) .theme-toggle {
  background: color-mix(in srgb, var(--color-bg-tertiary) 70%, #000 30%);
  border-color: color-mix(in srgb, var(--color-border-light) 60%, #1e293b 40%);
  box-shadow: inset 0 1px 3px rgb(15 23 42 / 0.4);
}

:global(.dark) .theme-toggle:hover {
  background: color-mix(in srgb, var(--color-primary) 20%, var(--color-bg-tertiary));
}

:global(.dark) .theme-toggle .knob {
  background: color-mix(in srgb, #f8fafc 90%, transparent);
  border-color: color-mix(in srgb, #cbd5e1 80%, transparent);
  box-shadow: 0 2px 4px rgb(15 23 42 / 0.4);
}

:global(.dark) .theme-toggle .icon {
  color: color-mix(in srgb, var(--color-text-tertiary) 60%, #f8fafc 40%);
}
</style>
