<template>
  <pre>{{ myData }}</pre>
</template>
<script setup>
import { queryCollection } from '#imports'
const c = await queryCollection("series").first();
const myData = JSON.stringify(c, null, 2);
</script>
