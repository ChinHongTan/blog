<template>
  <div class="admin-guide">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        撰寫指南
      </h1>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 overflow-y-auto">
      <ContentDoc path="/writing-guide" class="prose dark:prose-invert max-w-none">
        <template #not-found>
          <div class="text-center py-12 text-gray-500">
            找不到指南文件
          </div>
        </template>
      </ContentDoc>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useHead({
  title: '撰寫指南 | 管理介面'
})
</script>

<style scoped>
/* Scoped styles can be added here if needed, but styling mostly relies on Tailwind/prose */
</style>
