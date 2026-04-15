<script setup lang="ts">
import type { SeriesCardItem } from "~/types/content";
import { resolvePostPath } from "~/utils/post-path";

const props = defineProps<{
	item: SeriesCardItem;
}>();

const emit = defineEmits<{
	"filter:author": [authorId: string];
	"filter:series": [seriesName: string];
}>();

const seriesUrl = computed(
	() => `/series/${encodeURIComponent(props.item.seriesName)}`,
);

const authorLabel = computed(() => {
	const names = props.item.authors.slice(0, 2).map((a) => a.name);
	if (props.item.authors.length > 2) {
		return `${names.join("、")} 等 ${props.item.authors.length} 位作者`;
	}
	return names.join("、");
});

const latestDateFormatted = computed(() =>
	new Date(props.item.latestPost.date).toLocaleDateString("zh-TW", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}),
);

const countLabel = computed(() => {
	if (
		props.item.postCount < props.item.totalPostCount
	) {
		return `${props.item.postCount} / ${props.item.totalPostCount} 篇文章`;
	}
	return `${props.item.postCount} 篇文章`;
});

const isExpanded = ref(false);
</script>

<template>
	<div class="series-feed-card">
		<!-- Image area -->
		<NuxtLink :to="seriesUrl" class="series-feed-image-link">
			<div class="series-feed-image">
				<NuxtImg
					v-if="item.latestPost.featured_image"
					:src="item.latestPost.featured_image"
					:alt="item.seriesName"
					sizes="sm:100vw md:400px lg:400px"
					format="webp"
					loading="lazy"
				/>
				<div v-else class="series-feed-image-placeholder">
					<Icon name="heroicons:book-open" size="40" />
				</div>
				<div class="series-feed-badge">
					<Icon name="heroicons:bookmark-square" size="14" />
					{{ countLabel }}
				</div>
			</div>
		</NuxtLink>

		<!-- Card body -->
		<div class="series-feed-body">
			<NuxtLink :to="seriesUrl" class="series-feed-title-link">
				<h3 class="series-feed-title">{{ item.seriesName }}</h3>
			</NuxtLink>

			<p class="series-feed-latest">
				最新：{{ item.latestPost.title }}
			</p>

			<!-- Meta row -->
			<div class="series-feed-meta-row">
				<div class="series-feed-meta-main">
					<div class="series-feed-authors-stack">
						<button
							v-for="author in item.authors.slice(0, 3)"
							:key="author.id"
							type="button"
							class="series-feed-author-btn"
							:title="author.name"
							@click.stop="emit('filter:author', author.id)"
						>
							<NuxtImg
								:src="author.avatar"
								:alt="author.name"
								class="series-feed-author-avatar"
								width="30"
								height="30"
								format="webp"
								loading="lazy"
							/>
						</button>
					</div>
					<div class="series-feed-meta-text">
						<span class="series-feed-author-names">{{ authorLabel }}</span>
						<span class="meta-divider-dot">&bull;</span>
						<span class="series-feed-date">
							<Icon
								name="heroicons:calendar-days-20-solid"
								size="16"
								class="meta-icon"
							/>
							{{ latestDateFormatted }}
						</span>
					</div>
				</div>
			</div>

			<!-- Expandable post list -->
			<div class="series-feed-expand">
				<ol class="series-feed-post-list visible-posts">
					<li
						v-for="(post, index) in item.posts.slice(0, 3)"
						:key="post.id"
						class="series-feed-post-item"
					>
						<span class="series-feed-post-item-no">{{ index + 1 }}.</span>
						<NuxtLink :to="resolvePostPath(post)">
							{{ post.title }}
						</NuxtLink>
					</li>
				</ol>

				<template v-if="item.posts.length > 3">
					<div
						class="series-feed-post-list-wrapper"
						:class="{ 'is-open': isExpanded }"
						:aria-expanded="isExpanded"
					>
						<div class="series-feed-post-list-inner">
							<ol class="series-feed-post-list hidden-posts">
								<li
									v-for="(post, index) in item.posts.slice(3)"
									:key="post.id"
									class="series-feed-post-item"
								>
									<span class="series-feed-post-item-no">{{ index + 4 }}.</span>
									<NuxtLink :to="resolvePostPath(post)">
										{{ post.title }}
									</NuxtLink>
								</li>
							</ol>
						</div>
					</div>
					<button type="button" class="series-feed-expand-btn" @click.prevent="isExpanded = !isExpanded">
						<Icon
							name="heroicons:chevron-right-20-solid"
							size="16"
							class="expand-icon"
							:class="{ 'is-open': isExpanded }"
						/>
						{{ isExpanded ? "收起文章" : `展開其餘 ${item.posts.length - 3} 篇文章...` }}
					</button>
				</template>
			</div>

			<!-- View series link -->
			<NuxtLink :to="seriesUrl" class="series-feed-readmore">
				<span>查看完整系列</span>
				<Icon name="heroicons:chevron-right-20-solid" size="16" />
			</NuxtLink>
		</div>
	</div>
</template>

<style scoped>
.series-feed-card {
	display: flex;
	flex-direction: column;
	border-left: 3px solid var(--color-accent);
}

/* Image */
.series-feed-image-link {
	text-decoration: none;
}

.series-feed-image {
	width: 100%;
	height: 140px;
	overflow: hidden;
	background: var(--color-bg-tertiary);
	position: relative;
}

.series-feed-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform var(--transition-slow);
}

.series-feed-card:hover .series-feed-image img {
	transform: scale(1.05);
}

.series-feed-image-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(
		135deg,
		color-mix(in srgb, var(--color-primary-light) 25%, var(--color-bg-tertiary)),
		color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-tertiary))
	);
}

.series-feed-image-placeholder :deep(svg) {
	color: var(--color-primary);
	opacity: 0.4;
}

/* Badge on image */
.series-feed-badge {
	position: absolute;
	top: 0.75rem;
	right: 0.75rem;
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.3rem 0.65rem;
	background: color-mix(in srgb, var(--color-bg-primary) 80%, transparent);
	backdrop-filter: blur(8px);
	border: 1px solid color-mix(in srgb, var(--color-border-light) 60%, transparent);
	border-radius: var(--radius-pill);
	font-size: 0.78rem;
	font-weight: 600;
	color: var(--color-primary-dark);
}

/* Body */
.series-feed-body {
	padding: 1.15rem;
	display: flex;
	flex-direction: column;
	flex: 1;
	gap: 0.5rem;
}

.series-feed-title-link {
	text-decoration: none;
	color: inherit;
}

.series-feed-title {
	font-size: 1.28rem;
	font-weight: 700;
	color: var(--color-text-primary);
	line-height: 1.4;
	margin: 0;
	transition: color var(--transition-base);
}

.series-feed-title-link:hover .series-feed-title {
	color: var(--color-primary);
}

.series-feed-latest {
	font-size: 0.92rem;
	color: var(--color-text-secondary);
	margin: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* Meta row */
.series-feed-meta-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.series-feed-meta-main {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
}

.series-feed-authors-stack {
	display: flex;
	flex-shrink: 0;
}

.series-feed-author-btn {
	background: none;
	border: none;
	padding: 0;
	margin-left: -6px;
	cursor: pointer;
	line-height: 0;
	border-radius: var(--radius-full);
	transition: transform var(--transition-base);
}

.series-feed-author-btn:first-child {
	margin-left: 0;
}

.series-feed-author-btn:hover {
	transform: scale(1.15);
	z-index: 1;
}

.series-feed-author-avatar {
	width: 28px;
	height: 28px;
	border-radius: var(--radius-full);
	object-fit: cover;
	border: 2px solid var(--color-bg-primary);
}

.series-feed-meta-text {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.88rem;
	color: var(--color-text-tertiary);
	min-width: 0;
}

.series-feed-author-names {
	font-weight: 600;
	color: var(--color-text-primary);
	font-size: 0.88rem;
}

.meta-divider-dot {
	color: var(--color-text-tertiary);
	font-size: 0.65rem;
}

.series-feed-date {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	color: var(--color-text-secondary);
	white-space: nowrap;
}

.meta-icon {
	color: var(--color-text-tertiary);
}

/* Expandable post list */
.series-feed-expand {
	border-top: 1px solid var(--color-border-light);
	padding-top: 0.5rem;
}

.series-feed-expand-btn {
	cursor: pointer;
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--color-text-tertiary);
	background: transparent;
	border: none;
	padding: 0;
	display: flex;
	align-items: center;
	gap: 0.3rem;
	margin-top: 0.5rem;
	user-select: none;
	transition: color var(--transition-base);
}

.series-feed-expand-btn:focus-visible {
	outline: 2px solid var(--color-primary);
	outline-offset: 2px;
	border-radius: 4px;
}

.series-feed-expand-btn:hover {
	color: var(--color-primary);
}

.expand-icon {
	transition: transform var(--transition-slow);
}

.expand-icon.is-open {
	transform: rotate(90deg);
}

.series-feed-post-list-wrapper {
	display: grid;
	grid-template-rows: 0fr;
	transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.series-feed-post-list-wrapper.is-open {
	grid-template-rows: 1fr;
}

.series-feed-post-list-inner {
	min-height: 0;
	overflow: hidden;
}

.series-feed-post-list {
	padding: 0 0 0 1.4rem;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	list-style: none; /* Remove default numbering so we can style our own */
}

.series-feed-post-list.visible-posts {
	padding-top: 0.5rem;
	margin-bottom: 0.25rem;
}

.series-feed-post-item {
	font-size: 0.85rem;
	color: var(--color-text-tertiary);
	display: flex;
	gap: 0.4rem;
}

.series-feed-post-item-no {
	flex-shrink: 0;
	color: var(--color-text-muted, #888); /* Adjust for light/dark mode */
	font-family: monospace;
	font-variant-numeric: tabular-nums;
	min-width: 1.5rem;
}

.series-feed-post-item a {
	color: var(--color-text-secondary);
	text-decoration: none;
	transition: color var(--transition-base);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.series-feed-post-item a:hover {
	color: var(--color-primary);
}

/* Read more link */
.series-feed-readmore {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	align-self: flex-end;
	font-size: 0.94rem;
	font-weight: 600;
	color: var(--color-text-secondary); /* Restyled from primary-dark to secondary to match mockup muted feel */
	text-decoration: none;
	padding: 0.2rem 0.45rem;
	border-radius: var(--radius-md);
	transition: color var(--transition-base);
	margin-top: auto;
}

.series-feed-readmore:hover {
	color: var(--color-primary); /* Only shows primary accent on hover */
}

.series-feed-readmore :deep(svg) {
	transition: transform var(--transition-base);
}

.series-feed-readmore:hover :deep(svg) {
	transform: translateX(4px);
}

@media (max-width: 480px) {
	.series-feed-image {
		height: 110px;
	}

	.series-feed-body {
		padding: 0.9rem;
	}

	.series-feed-title {
		font-size: 1.1rem;
	}

	.series-feed-meta-text {
		flex-wrap: wrap;
	}
}
</style>
