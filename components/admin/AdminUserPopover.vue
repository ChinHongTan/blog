<template>
  <div class="admin-user-popover-wrap">
    <button
      ref="triggerRef"
      type="button"
      class="admin-user-chip"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <img :src="displayAvatar" :alt="displayName" class="admin-user-chip-avatar" width="28" height="28" >
      <span class="admin-user-chip-name">{{ displayName }}</span>
      <Icon name="heroicons:chevron-down" size="14" class="admin-user-chip-chevron" :class="{ open }" />
    </button>
    <Teleport to="body">
      <Transition name="popover">
        <div
          v-if="open"
          ref="panelRef"
          class="admin-user-popover"
          role="dialog"
          aria-label="使用者選單"
          @click.stop
        >
          <!-- Mini banner -->
          <div class="admin-user-popover-banner" :class="{ empty: !profileBanner }">
            <img v-if="profileBanner" :src="profileBanner" alt="" class="admin-user-popover-banner-img" >
            <div v-else class="admin-user-popover-banner-placeholder" />
          </div>
          <div class="admin-user-popover-body">
            <img :src="displayAvatar" :alt="displayName" class="admin-user-popover-avatar" width="56" height="56" >
            <h3 class="admin-user-popover-name">{{ displayName }}</h3>
            <p v-if="profileBio" class="admin-user-popover-bio">{{ profileBio }}</p>
            <NuxtLink to="/admin/profile" class="admin-user-popover-edit" @click="open = false">
              <Icon name="heroicons:pencil-square" size="18" />
              編輯個人資料
            </NuxtLink>
            <button type="button" class="admin-user-popover-logout" @click="onLogout">
              <Icon name="heroicons:arrow-right-on-rectangle" size="18" />
              登出
            </button>
          </div>
        </div>
      </Transition>
      <div v-if="open" class="admin-user-popover-backdrop" aria-hidden="true" @click="open = false" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
type ProfileMe = {
  login: string;
  name: string | null;
  avatar_url: string;
  authorPath: string | null;
  profile: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    social?: { github?: string; twitter?: string; website?: string };
    body?: string;
  } | null;
};

const { user, logout } = useAdminAuth();
const open = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const profileMe = ref<ProfileMe | null>(null);

const displayName = computed(() => {
  if (profileMe.value?.profile?.name) return profileMe.value.profile.name;
  return user.value?.name || user.value?.login || "使用者";
});

const displayAvatar = computed(() => {
  if (profileMe.value?.profile?.avatar) return profileMe.value.profile.avatar;
  return user.value?.avatar_url || "";
});

const profileBanner = computed(() => profileMe.value?.profile?.banner ?? null);
const profileBio = computed(() => profileMe.value?.profile?.bio ?? null);

async function fetchProfile() {
  if (!user.value) return;
  try {
    profileMe.value = await $fetch<ProfileMe>("/api/admin/profile/me");
  } catch {
    profileMe.value = null;
  }
}

watch(open, (isOpen) => {
  if (isOpen) fetchProfile();
});

watch(() => user.value, (u) => {
  if (u) fetchProfile();
}, { immediate: true });

function onLogout() {
  open.value = false;
  logout();
}

onMounted(() => {
  if (user.value) fetchProfile();
});
</script>

<style scoped>
.admin-user-popover-wrap {
  position: relative;
  display: inline-flex;
}

.admin-user-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-light);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.admin-user-chip:hover {
  background: var(--color-bg-blue-tint);
  border-color: var(--color-primary-light);
}

.admin-user-chip-avatar {
  border-radius: 50%;
  flex-shrink: 0;
}

.admin-user-chip-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-user-chip-chevron {
  color: var(--color-text-tertiary);
  transition: transform 0.2s;
}

.admin-user-chip-chevron.open {
  transform: rotate(180deg);
}

.admin-user-popover-backdrop {
  position: fixed;
  inset: 0;
  z-index: 199;
}

.admin-user-popover {
  position: fixed;
  z-index: 200;
  top: calc(var(--header-height, 70px) + 0.5rem);
  right: 1rem;
  width: 320px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.admin-user-popover-banner {
  height: 60px;
  background: var(--color-bg-tertiary);
  overflow: hidden;
}

.admin-user-popover-banner.empty .admin-user-popover-banner-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 25%, var(--color-bg-tertiary)) 0%,
    color-mix(in srgb, var(--color-accent) 15%, var(--color-bg-tertiary)) 100%
  );
}

.admin-user-popover-banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-user-popover-body {
  padding: 2rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.admin-user-popover-avatar {
  border-radius: 50%;
  border: 3px solid var(--color-bg-primary);
  box-shadow: var(--shadow-md);
  margin-top: -40px;
  background: var(--color-bg-primary);
}

.admin-user-popover-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-align: center;
}

.admin-user-popover-bio {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.admin-user-popover-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary-dark);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border: 1px solid var(--color-primary-light);
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
}

.admin-user-popover-edit:hover {
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-color: var(--color-primary);
}

.admin-user-popover-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.admin-user-popover-logout:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.popover-enter-active,
.popover-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
