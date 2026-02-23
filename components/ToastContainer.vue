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
	z-index: 9999;
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
	border-radius: 8px;
	font-size: 0.9rem;
	cursor: pointer;
	box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.toast-success {
	background: #065f46;
	color: #d1fae5;
}
.toast-error {
	background: #991b1b;
	color: #fecaca;
}
.toast-info {
	background: var(--color-bg-primary, #fff);
	color: var(--color-text-primary, #1e293b);
	border: 1px solid var(--color-border-light, #e2e8f0);
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
