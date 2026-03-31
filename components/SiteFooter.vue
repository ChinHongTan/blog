<script setup lang="ts">
const currentYear = new Date().getFullYear();

const { data: postCount } = useAsyncData("post-count", () =>
	queryCollection("blog").count()
);

const LAUNCH_DATE = new Date("2025-10-24T00:00:00+08:00").getTime();

const days = ref(0);
const hours = ref(0);
const minutes = ref(0);
const seconds = ref(0);

let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
	const diff = Date.now() - LAUNCH_DATE;
	days.value = Math.floor(diff / 86_400_000);
	hours.value = Math.floor((diff % 86_400_000) / 3_600_000);
	minutes.value = Math.floor((diff % 3_600_000) / 60_000);
	seconds.value = Math.floor((diff % 60_000) / 1_000);
}

onMounted(() => {
	tick();
	timer = setInterval(tick, 1000);
});

onUnmounted(() => {
	if (timer) clearInterval(timer);
});
</script>

<template>
	<footer class="site-footer">
		<div class="footer-row">
			<div class="footer-col footer-left">
				<p class="footer-copyright">
					&copy; {{ currentYear }} 星谷雜貨店.
					<a
						href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
						target="_blank"
						rel="noopener noreferrer"
						class="footer-cc-link"
					>CC BY-NC-SA 4.0</a>
				</p>
				<div class="footer-links">
					<NuxtLink to="/code-of-conduct">行為準則</NuxtLink>
					<span class="separator">&bull;</span>
					<a href="https://github.com/ChinHongTan/blog" target="_blank" rel="noopener">GitHub</a>
					<span class="separator">&bull;</span>
					<NuxtLink to="/writing-guide">撰寫指南</NuxtLink>
				</div>
			</div>

			<div class="footer-col footer-center">
				<div class="uptime-ticker">
					<Icon name="heroicons:clock" size="13" class="ticker-icon" />
					已運行
					<span class="ticker-num">{{ days }}</span><span class="ticker-unit">天</span>
					<span class="ticker-num">{{ hours }}</span><span class="ticker-unit">時</span>
					<span class="ticker-num">{{ minutes }}</span><span class="ticker-unit">分</span>
					<span class="ticker-num">{{ seconds }}</span><span class="ticker-unit">秒</span>
				</div>
				<div class="vercount-stats">
					<span v-if="postCount" class="vercount-item">
						<Icon name="heroicons:document-text" size="13" />
						<span class="vercount-num">{{ postCount }}</span> 篇文章
					</span>
					<span v-if="postCount" class="vercount-sep">&bull;</span>
					<span class="vercount-item">
						<Icon name="heroicons:eye" size="13" />
						<span id="vercount_value_site_pv" class="vercount-num">-</span> 次瀏覽
					</span>
					<span class="vercount-sep">&bull;</span>
					<span class="vercount-item">
						<Icon name="heroicons:users" size="13" />
						<span id="vercount_value_site_uv" class="vercount-num">-</span> 位訪客
					</span>
				</div>
			</div>

			<div class="footer-col footer-right">
				<span class="powered-label">小破站靠著這些工具撐著：</span>
				<div class="service-badges">
					<a href="https://vercel.com" target="_blank" rel="noopener" class="service-link">
						<img src="/images/logos/vercel-logo-black.svg" alt="Vercel" class="service-logo logo-light">
						<img src="/images/logos/vercel-logo-white.svg" alt="Vercel" class="service-logo logo-dark">
					</a>
					<a href="https://nuxt.com" target="_blank" rel="noopener" class="service-link">
						<img src="/images/logos/nuxt-logo-green-black.svg" alt="Nuxt" class="service-logo logo-light">
						<img src="/images/logos/nuxt-logo-green-white.svg" alt="Nuxt" class="service-logo logo-dark">
					</a>
				</div>
			</div>
		</div>
	</footer>
</template>

<style>
.site-footer {
	position: relative;
	z-index: 1;
	margin-top: 2.25rem;
	padding: var(--space-3) 0;
	border-top: 1px solid var(--color-border-light);
}

.footer-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	font-size: 0.78rem;
	color: var(--color-text-primary);
}

.footer-col {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}

.footer-left {
	align-items: flex-start;
}

.footer-center {
	align-items: center;
	text-align: center;
}

.footer-right {
	align-items: flex-end;
}

.footer-copyright {
	margin: 0;
	color: var(--color-text-primary);
}

.footer-cc-link {
	color: var(--color-text-secondary);
	text-decoration: none;
	transition: color 0.2s ease;
}

.footer-cc-link:hover {
	color: var(--color-primary-dark);
}

.footer-links {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.footer-links a {
	color: var(--color-text-primary);
	text-decoration: none;
	transition: color var(--transition-base);
}

.footer-links a:hover {
	color: var(--color-primary);
}

.footer-links .separator {
	color: var(--color-text-secondary);
	font-size: 0.6rem;
}

.uptime-ticker {
	display: flex;
	align-items: center;
	gap: 0.15rem;
	font-variant-numeric: tabular-nums;
}

.ticker-icon {
	margin-right: 0.15rem;
	opacity: 0.6;
}

.ticker-num {
	font-weight: 600;
	color: var(--color-primary);
	min-width: 1.3em;
	text-align: right;
}

.ticker-unit {
	opacity: 0.7;
	margin-right: 0.1rem;
}

.vercount-stats {
	display: flex;
	align-items: center;
	gap: 0.4rem;
}

.vercount-item {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
}

.vercount-num {
	font-weight: 600;
	color: var(--color-text-secondary);
}

.vercount-sep {
	color: var(--color-text-tertiary);
	font-size: 0.55rem;
}

.powered-label {
	font-size: 0.7rem;
	color: var(--color-text-secondary);
}

.service-badges {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.service-link {
	display: flex;
	align-items: center;
	opacity: 0.65;
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
	text-decoration: none;
}

.service-link:hover {
	opacity: 1;
	transform: translateY(-1px);
}

.service-logo {
	height: 15px;
	width: auto;
	object-fit: contain;
	transition: opacity var(--transition-base);
}

.service-link {
	position: relative;
}

.logo-light {
	opacity: 1;
}

.logo-dark {
	position: absolute;
	top: 0;
	left: 0;
	opacity: 0;
}

html.dark .logo-light {
	opacity: 0;
}

html.dark .logo-dark {
	opacity: 1;
}

@media (max-width: 768px) {
	.site-footer {
		padding: 1rem 1rem;
	}

	.footer-row {
		flex-direction: column;
		text-align: center;
		gap: 0.6rem;
	}

	.footer-left,
	.footer-center,
	.footer-right {
		align-items: center;
	}
}
</style>
