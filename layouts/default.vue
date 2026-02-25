<script setup>
import { SpeedInsights } from '@vercel/speed-insights/vue'
</script>

<template>
  <div class="default-layout">
    <slot />
    <SpeedInsights />
  </div>
</template>
