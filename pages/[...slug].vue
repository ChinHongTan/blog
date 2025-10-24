<script setup lang="ts">
const route = useRoute();

// This queries your 'blog' collection
// and finds the page where the path matches the current URL
const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first()
});
</script>

<template>
  <article v-if="page" class="blog-post">
    <header>
      <h1>{{ page.title }}</h1>
      <p class="date">
        Published on: {{ new Date(page.date).toLocaleDateString() }}
      </p>
    </header>
    <img v-if="page.featured_image" :src="page.featured_image" class="hero-image">

    <ContentRenderer :value="page" />

  </article>
  <div v-else>
    <h1>Post not found</h1>
  </div>
</template>

<style>
  /* All your post styling here */
  .blog-post { max-width: 720px; margin: 40px auto; }
  .hero-image { width: 100%; }
  .date { font-style: italic; color: #777; }
</style>