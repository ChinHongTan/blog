<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<template>
	<footer class="site-footer">
		<div class="footer-info">
			<p>
				&copy; {{ currentYear }} 星谷雜貨店.
				<a
					href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
					target="_blank"
					rel="noopener noreferrer"
					class="footer-cc-link"
				>
					CC BY-NC-SA 4.0
				</a>
			</p>
			<p class="footer-cc-text">
				除另有註明外，本站內容採用創用 CC
				姓名標示-非商業性-相同方式分享 4.0 國際授權條款。
			</p>
			<div class="footer-links">
				<NuxtLink to="/code-of-conduct">行為準則</NuxtLink>
				<span class="separator">&bull;</span>
				<a
					href="https://github.com/ChinHongTan/blog"
					target="_blank"
					rel="noopener"
				>GitHub</a>
			</div>
		</div>
		<div class="powered-by">
			<span>使用以下工具建構：</span>
			<div class="service-badges">
				<a
					href="https://vercel.com"
					target="_blank"
					rel="noopener"
					class="service-link"
				>
					<img
						src="/images/logos/vercel-logo-black.svg"
						alt="Vercel"
						class="service-logo logo-light"
					>
					<img
						src="/images/logos/vercel-logo-white.svg"
						alt="Vercel"
						class="service-logo logo-dark"
					>
				</a>
				<a
					href="https://nuxt.com"
					target="_blank"
					rel="noopener"
					class="service-link"
				>
					<img
						src="/images/logos/nuxt-logo-green-black.svg"
						alt="Nuxt"
						class="service-logo logo-light"
					>
					<img
						src="/images/logos/nuxt-logo-green-white.svg"
						alt="Nuxt"
						class="service-logo logo-dark"
					>
				</a>
				<a
					href="https://decapcms.org"
					target="_blank"
					rel="noopener"
					class="service-link"
				>
					<img
						src="/images/logos/decap-logo-black.svg"
						alt="Decap CMS"
						class="service-logo decap-logo logo-light"
					>
					<img
						src="/images/logos/decap-logo-white.svg"
						alt="Decap CMS"
						class="service-logo decap-logo logo-dark"
					>
				</a>
			</div>
		</div>
	</footer>
</template>
