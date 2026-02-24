<script setup lang="ts">
const { toasts, dismiss } = useToast();
</script>

<template>
	<Teleport to="body">
		<div class="toast-container" aria-live="polite">
			<TransitionGroup name="toast">
				<div
					v-for="toast in toasts"
					:key="toast.id"
					:class="['toast', `toast-${toast.type}`]"
					role="alert"
					@click="dismiss(toast.id)"
				>
					<span class="toast-msg">{{ toast.message }}</span>
					<button type="button" class="toast-close" aria-label="關閉">&times;</button>
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<style scoped>
.toast-container {
	position: fixed;
	top: 1rem;
	right: 1rem;
	z-index: var(--z-toast);
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	max-width: 380px;
}
.toast {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	border-radius: var(--radius-lg);
	font-size: 0.9rem;
	cursor: pointer;
	border: 1px solid var(--color-border-light);
	box-shadow: var(--shadow-lg);
}
.toast-success {
	background: var(--color-success-bg);
	border-color: var(--color-success-border);
	color: var(--color-success-text);
}
.toast-error {
	background: var(--color-error-bg);
	border-color: var(--color-error-border);
	color: var(--color-error-text);
}
.toast-info {
	background: var(--color-info-bg);
	border-color: var(--color-info-border);
	color: var(--color-info-text);
}
.toast-msg {
	flex: 1;
}
.toast-close {
	background: none;
	border: none;
	color: inherit;
	font-size: 1.2rem;
	cursor: pointer;
	opacity: 0.7;
	line-height: 1;
}
.toast-close:hover {
	opacity: 1;
}
.toast-enter-active {
	transition: all 0.3s ease;
}
.toast-leave-active {
	transition: all 0.2s ease;
}
.toast-enter-from {
	opacity: 0;
	transform: translateX(100%);
}
.toast-leave-to {
	opacity: 0;
	transform: translateX(100%);
}
</style>
