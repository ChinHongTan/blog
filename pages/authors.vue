<script setup lang="ts">
import type { BlogCollectionItem } from "@nuxt/content";

// Fetch all authors from the authors collection
const { data: authors } = await useAsyncData("all-authors", () =>
	queryCollection("authors").all()
);

// Fetch all posts to count per author
const { data: posts } = await useAsyncData<BlogCollectionItem[]>("authors-page-posts", () =>
	queryCollection("blog").all()
);

const authorPostCounts = computed(() => {
	const counts: Record<string, number> = {};
	(posts.value ?? []).forEach((post) => {
		if (post.author) {
			counts[post.author] = (counts[post.author] || 0) + 1;
		}
	});
	return counts;
});

useHead({
	title: "作者 - 七糯糯的小站",
});
</script>

<template>
	<div class="authors-page">
		<header class="page-header">
			<h1 class="page-title">
				<Icon name="heroicons:users" size="36" />
				所有作者
			</h1>
			<p class="page-description">認識我們部落格的作者團隊</p>
		</header>

		<div v-if="authors && authors.length" class="authors-grid">
			<NuxtLink
				v-for="author in authors"
				:key="author.name"
				:to="`/author/${encodeURIComponent(author.name)}`"
				class="author-card"
			>
				<div class="author-avatar-large">
					<img
						v-if="author.avatar"
						:src="author.avatar"
						:alt="author.name"
					/>
					<div v-else class="avatar-placeholder">
						{{ author.name[0] }}
					</div>
				</div>

				<div class="author-details">
					<h2 class="author-name">{{ author.name }}</h2>
					<p v-if="author.bio" class="author-bio">{{ author.bio }}</p>

					<div class="author-stats-row">
						<span class="author-post-count">
							<Icon name="heroicons:document-text" size="14" />
							{{ authorPostCounts[author.name] || 0 }} 篇文章
						</span>
					</div>

					<div v-if="author.social" class="author-social">
						<span
							v-if="author.social.github"
							class="social-link"
							@click.prevent
						>
							<Icon name="mdi:github" size="20" />
						</span>
						<span
							v-if="author.social.twitter"
							class="social-link"
							@click.prevent
						>
							<Icon name="mdi:twitter" size="20" />
						</span>
						<span
							v-if="author.social.website"
							class="social-link"
							@click.prevent
						>
							<Icon name="heroicons:globe-alt" size="20" />
						</span>
					</div>
				</div>

				<div class="author-card-arrow">
					<Icon name="heroicons:chevron-right" size="20" />
				</div>
			</NuxtLink>
		</div>

		<div v-else class="no-authors">
			<p>目前還沒有作者資料。</p>
		</div>

		<div class="page-footer">
			<p>想加入我們嗎？歡迎在Discord上聯繫我們！</p>
		</div>
	</div>
</template>

<style scoped>
.authors-page {
	max-width: 900px;
	margin: 0 auto;
	padding: 1rem 0;
}

.page-header {
	text-align: center;
	margin-bottom: 2.5rem;
}

.page-title {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.6rem;
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--color-text-primary);
	margin-bottom: 0.5rem;
}

.page-title :deep(svg) {
	color: var(--color-primary);
}

.page-description {
	font-size: 1.1rem;
	color: var(--color-text-secondary);
	margin: 0;
}

.authors-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.author-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
	background: var(--panel-bg);
	border: 1px solid var(--color-border-light);
	border-radius: 14px;
	padding: 2rem 1.5rem;
	box-shadow: var(--shadow-sm);
	backdrop-filter: saturate(1.08) blur(var(--glass-blur));
	text-decoration: none;
	color: inherit;
	transition: all 0.3s ease;
}

.author-card:hover {
	transform: translateY(-4px);
	box-shadow: var(--shadow-lg);
	border-color: var(--color-primary-light);
}

.author-card-arrow {
	position: absolute;
	top: 1rem;
	right: 1rem;
	color: var(--color-text-tertiary);
	transition: all 0.2s ease;
}

.author-card:hover .author-card-arrow {
	color: var(--color-primary);
	transform: translateX(3px);
}

.author-avatar-large {
	width: 90px;
	height: 90px;
	margin-bottom: 1rem;
	border-radius: 50%;
	overflow: hidden;
	border: 3px solid var(--color-primary);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	flex-shrink: 0;
}

.author-avatar-large img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.avatar-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(
		135deg,
		var(--color-primary) 0%,
		var(--color-accent) 100%
	);
	color: white;
	font-size: 2.2rem;
	font-weight: 700;
}

.author-details {
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.4rem;
}

.author-name {
	font-size: 1.35rem;
	font-weight: 600;
	color: var(--color-text-primary);
	margin: 0;
}

.author-card:hover .author-name {
	color: var(--color-primary-dark);
}

.author-bio {
	font-size: 0.9rem;
	color: var(--color-text-secondary);
	line-height: 1.6;
	margin: 0;
}

.author-stats-row {
	display: flex;
	gap: 0.5rem;
}

.author-post-count {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	font-size: 0.82rem;
	color: var(--color-text-tertiary);
	background: color-mix(in srgb, var(--color-bg-secondary) 70%, transparent);
	border: 1px solid var(--color-border-light);
	padding: 0.2rem 0.6rem;
	border-radius: 999px;
}

.author-social {
	display: flex;
	gap: 0.5rem;
	margin-top: 0.25rem;
}

.social-link {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: var(--color-bg-tertiary);
	color: var(--color-text-secondary);
	cursor: default;
}

.no-authors {
	text-align: center;
	padding: 3rem;
	color: var(--color-text-secondary);
}

.page-footer {
	text-align: center;
	padding: 1.5rem;
	border-top: 1px solid var(--color-border-light);
	color: var(--color-text-secondary);
	border-radius: 0 0 14px 14px;
}

@media (max-width: 768px) {
	.authors-page {
		padding: 0.5rem 0;
	}

	.page-title {
		font-size: 2rem;
	}

	.authors-grid {
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.author-card {
		flex-direction: row;
		text-align: left;
		gap: 1rem;
		padding: 1.25rem;
	}

	.author-avatar-large {
		width: 64px;
		height: 64px;
		margin-bottom: 0;
	}

	.author-details {
		text-align: left;
		align-items: flex-start;
	}
}
</style>
