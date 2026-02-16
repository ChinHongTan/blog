export function useAdminAuth() {
  const user = ref<{ login: string; name: string | null; avatar_url: string } | null>(null);
  const loading = ref(true);

  async function fetchUser() {
    loading.value = true;
    try {
      const data = await $fetch<{ login: string; name: string | null; avatar_url: string } | null>("/api/admin/auth/me");
      user.value = data;
      return data;
    } catch {
      user.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  function login() {
    window.location.href = "/api/admin/auth/login";
  }

  async function logout() {
    await $fetch("/api/admin/auth/logout", { method: "POST" });
    user.value = null;
    window.location.href = "/admin";
  }

  onMounted(() => {
    fetchUser();
  });

  return { user, loading, fetchUser, login, logout };
}
