<script setup lang="ts">
// Fetch all authors from the authors collection
const { data: authors } = await useAsyncData('all-authors', () =>
  queryCollection('authors').all()
);
</script>

<template>
  <div class="authors-page">
    <header class="page-header">
      <h1 class="page-title">所有作者</h1>
      <p class="page-description">認識我們部落格的作者團隊</p>
    </header>

    <div v-if="authors && authors.length" class="authors-grid">
      <div v-for="author in authors" :key="author.name" class="author-card">
        <div class="author-avatar-large">
          <img 
            v-if="author.avatar" 
            :src="author.avatar" 
            :alt="author.name"
          >
          <div v-else class="avatar-placeholder">
            {{ author.name[0] }}
          </div>
        </div>
        
        <div class="author-details">
          <h2 class="author-name">{{ author.name }}</h2>
          <p v-if="author.bio" class="author-bio">{{ author.bio }}</p>
          <p v-if="author.email" class="author-email">
            <Icon name="heroicons:envelope" size="16" />
            <a :href="`mailto:${author.email}`">{{ author.email }}</a>
          </p>
          
          <div v-if="author.social" class="author-social">
            <a 
              v-if="author.social.github" 
              :href="author.social.github" 
              target="_blank" 
              rel="noopener"
              class="social-link"
            >
              <Icon name="mdi:github" size="20" />
            </a>
            <a 
              v-if="author.social.twitter" 
              :href="author.social.twitter" 
              target="_blank" 
              rel="noopener"
              class="social-link"
            >
              <Icon name="mdi:twitter" size="20" />
            </a>
            <a 
              v-if="author.social.website" 
              :href="author.social.website" 
              target="_blank" 
              rel="noopener"
              class="social-link"
            >
              <Icon name="heroicons:globe-alt" size="20" />
            </a>
          </div>
        </div>
      </div>
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.page-description {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
}

.authors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.author-card {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.author-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.author-avatar-large {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--color-primary);
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
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
}

.author-details {
  text-align: center;
}

.author-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.author-bio {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.author-email {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.author-email a {
  color: var(--color-primary);
  text-decoration: none;
}

.author-email a:hover {
  text-decoration: underline;
}

.author-social {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.social-link:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-2px);
}

.no-authors {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.page-footer {
  text-align: center;
  padding: 2rem;
  border-top: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .authors-page {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .authors-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
