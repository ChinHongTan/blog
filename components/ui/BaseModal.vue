<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean;
  title?: string;
  description?: string;
  variant?: "default" | "danger";
  role?: "dialog" | "alertdialog";
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  width?: "sm" | "md" | "lg";
  panelClass?: string;
}>(), {
  title: "",
  description: "",
  variant: "default",
  role: "dialog",
  closeOnBackdrop: true,
  closeOnEsc: true,
  width: "md",
  panelClass: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close" | "overlay-click"): void;
}>();

const uid = Math.random().toString(36).slice(2, 10);
const titleId = `base-modal-title-${uid}`;
const descriptionId = `base-modal-desc-${uid}`;

const hasHeader = computed(() => !!props.title || !!useSlots().title);
const hasDescription = computed(() => !!props.description || !!useSlots().description);

function close() {
  emit("update:modelValue", false);
  emit("close");
}

function onOverlayClick() {
  emit("overlay-click");
  if (!props.closeOnBackdrop) return;
  close();
}

function onEscape(event: KeyboardEvent) {
  if (!props.modelValue) return;
  if (event.key !== "Escape" || !props.closeOnEsc) return;
  event.preventDefault();
  close();
}

function canUseDocument(): boolean {
  return typeof document !== "undefined";
}

watch(
  () => props.modelValue,
  (open) => {
    if (!canUseDocument()) return;
    if (open) {
      document.addEventListener("keydown", onEscape);
      return;
    }
    document.removeEventListener("keydown", onEscape);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (!canUseDocument()) return;
  document.removeEventListener("keydown", onEscape);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="base-modal">
      <div
        v-if="modelValue"
        class="base-modal-overlay"
        role="presentation"
        @click="onOverlayClick"
      >
        <div
          class="base-modal-panel"
          :class="[`is-${variant}`, `width-${width}`, panelClass]"
          :role="role"
          aria-modal="true"
          :aria-labelledby="hasHeader ? titleId : undefined"
          :aria-describedby="hasDescription ? descriptionId : undefined"
          @click.stop
        >
          <header v-if="hasHeader" class="base-modal-header">
            <slot name="title">
              <h3 :id="titleId" class="base-modal-title">{{ title }}</h3>
            </slot>
          </header>
          <div v-if="hasDescription" class="base-modal-description-wrap">
            <slot name="description">
              <p :id="descriptionId" class="base-modal-description">{{ description }}</p>
            </slot>
          </div>
          <div class="base-modal-content">
            <slot :close="close" />
          </div>
          <footer class="base-modal-actions">
            <slot name="actions" :close="close" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.base-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--overlay-bg);
  backdrop-filter: blur(var(--overlay-blur));
  -webkit-backdrop-filter: blur(var(--overlay-blur));
  z-index: var(--z-modal);
}

.base-modal-panel {
  width: min(100%, 32rem);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl), 0 0 0 1px color-mix(in srgb, var(--color-border-light) 72%, transparent);
  padding: var(--space-6);
}

.base-modal-panel.width-sm {
  max-width: 24rem;
}

.base-modal-panel.width-md {
  max-width: 30rem;
}

.base-modal-panel.width-lg {
  max-width: 40rem;
}

.base-modal-header {
  margin-bottom: var(--space-2);
}

.base-modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.base-modal-description-wrap {
  margin-bottom: var(--space-5);
}

.base-modal-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.55;
}

.base-modal-content {
  color: var(--color-text-primary);
}

.base-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.base-modal-panel.is-danger .base-modal-title {
  color: var(--color-error-text);
}

.base-modal-enter-active,
.base-modal-leave-active {
  transition: opacity 0.18s ease;
}

.base-modal-enter-active .base-modal-panel,
.base-modal-leave-active .base-modal-panel {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.base-modal-enter-from,
.base-modal-leave-to {
  opacity: 0;
}

.base-modal-enter-from .base-modal-panel,
.base-modal-leave-to .base-modal-panel {
  transform: translateY(8px) scale(0.985);
  opacity: 0;
}
</style>
