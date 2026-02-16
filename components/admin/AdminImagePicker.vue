<template>
  <div class="image-picker">
    <div class="image-picker-toolbar">
      <button type="button" class="admin-btn admin-btn-sm" @click="showUpload = true">上傳</button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="image-picker-input"
        @change="onFileSelect"
      >
    </div>
    <div class="image-picker-list">
      <button
        v-for="img in images"
        :key="img.path"
        type="button"
        class="image-picker-item"
        @click="select(img.path)"
      >
        <div class="image-picker-thumb-wrap">
          <img :src="img.path" :alt="img.name" class="image-picker-thumb" >
        </div>
        <span class="image-picker-label">{{ img.name }}</span>
      </button>
      <div v-if="images.length === 0 && !loading" class="image-picker-empty">尚無圖片，請上傳。</div>
      <div v-if="loading" class="image-picker-loading">載入中…</div>
    </div>
    <Teleport to="body">
      <div v-if="showUpload" class="image-picker-modal" @click.self="showUpload = false">
        <div class="image-picker-modal-inner">
          <h3>上傳圖片</h3>
          <form @submit.prevent="upload">
            <input ref="uploadInput" type="file" accept="image/*" required @change="uploadFile = $event.target?.files?.[0]" >
            <div class="image-picker-modal-actions">
              <button type="button" class="admin-btn admin-btn-ghost" @click="showUpload = false">取消</button>
              <button type="submit" class="admin-btn admin-btn-primary" :disabled="uploading || !uploadFile">
                {{ uploading ? "上傳中…" : "上傳" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  select: [path: string];
}>();

const images = ref<{ path: string; name: string }[]>([]);
const loading = ref(true);
const showUpload = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadInput = ref<HTMLInputElement | null>(null);
const uploadFile = ref<File | null>(null);
const uploading = ref(false);

async function load() {
  loading.value = true;
  try {
    images.value = await $fetch<{ path: string; name: string }[]>("/api/admin/repo/images?path=public/images");
  } catch {
    images.value = [];
  } finally {
    loading.value = false;
  }
}

function select(path: string) {
  emit("select", path);
}

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) doUpload(file);
  target.value = "";
}

async function upload() {
  if (!uploadFile.value) return;
  await doUpload(uploadFile.value);
  uploadFile.value = null;
  showUpload.value = false;
}

async function doUpload(file: File) {
  uploading.value = true;
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await $fetch<{ path: string }>("/api/admin/repo/upload", {
      method: "POST",
      body: form,
    });
    await load();
    emit("select", res.path);
  } catch (err) {
    console.error(err);
    alert("上傳失敗");
  } finally {
    uploading.value = false;
  }
}

onMounted(load);
defineExpose({ load });
</script>

<style scoped>
.image-picker {
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  overflow: hidden;
}
.image-picker-toolbar {
  padding: 0.5rem;
  background: var(--color-bg-tertiary);
  display: flex;
  gap: 0.5rem;
}
.image-picker-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
}
.admin-btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
}
.image-picker-list {
  max-height: 520px;
  min-height: 320px;
  overflow: auto;
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}
.image-picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.35rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  background: none;
  cursor: pointer;
  text-align: center;
}
.image-picker-item:hover {
  background: var(--color-bg-blue-tint);
  border-color: var(--color-primary);
}
.image-picker-thumb-wrap {
  width: 128px;
  height: 128px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  overflow: hidden;
  /* Checkerboard for transparency / empty space */
  background-color: var(--color-bg-secondary);
  background-image:
    linear-gradient(45deg, var(--color-bg-tertiary) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-bg-tertiary) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-bg-tertiary) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-bg-tertiary) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
}
.image-picker-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 0.375rem;
}
.image-picker-label {
  font-size: 0.6875rem;
  margin-top: 0.35rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 128px;
}
.image-picker-empty,
.image-picker-loading {
  grid-column: 1 / -1;
  padding: 1rem;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}
.image-picker-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.image-picker-modal-inner {
  background: var(--color-bg-primary);
  padding: 1.5rem;
  border-radius: 0.5rem;
  min-width: 420px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
}
.image-picker-modal-inner h3 {
  margin: 0 0 1rem;
  font-size: 1.125rem;
}
.image-picker-modal-inner input[type="file"] {
  margin-bottom: 1rem;
  display: block;
}
.image-picker-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
