<script setup lang="ts">
const { data: posts } = await useAsyncData(() => queryCollection("blog").all())

useSeoMeta({
  title: 'My Blog',
  description: 'Welcome to my blog'
})
</script>

<template>
  <div class="home">
    <h1>My Blog</h1>
    <div v-if="posts && posts.length > 0" class="post-list">
      <article v-for="post in posts" :key="post.path" class="post-preview">
        <NuxtLink :to="post.path">
          <h2>{{ post.title || 'Untitled Post' }}</h2>
          <p class="date">{{ new Date(post.date).toLocaleDateString() }}</p>
        </NuxtLink>
      </article>
    </div>
    <div v-else>No posts found</div>
  </div>
</template>

<style scoped>
.home { max-width: 720px; margin: 40px auto; }
.post-list { margin-top: 2rem; }
.post-preview { margin-bottom: 2rem; padding: 1rem; border: 1px solid #eee; }
.post-preview h2 { margin: 0 0 0.5rem 0; }
.date { font-style: italic; color: #777; font-size: 0.9rem; }
</style>