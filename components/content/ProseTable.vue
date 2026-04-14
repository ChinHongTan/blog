<template>
	<div class="table-wrapper">
		<table>
			<slot />
		</table>
	</div>
</template>

<style scoped>
.table-wrapper {
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
	max-width: 100%;
	margin: 1rem 0;
	border-radius: var(--radius-md);
	background:
		linear-gradient(to right, var(--color-bg-primary) 30%, transparent),
		linear-gradient(to right, transparent, var(--color-bg-primary) 70%) 100% 0,
		radial-gradient(farthest-side at 0 50%, rgba(0, 0, 0, 0.12), transparent),
		radial-gradient(farthest-side at 100% 50%, rgba(0, 0, 0, 0.12), transparent)
			100% 0;
	background-repeat: no-repeat;
	background-size:
		40px 100%,
		40px 100%,
		14px 100%,
		14px 100%;
	background-attachment: local, local, scroll, scroll;
}

.table-wrapper table {
	margin: 0;
}
</style>
