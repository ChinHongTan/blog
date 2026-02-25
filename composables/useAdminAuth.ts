type AdminAuthUser = { login: string; name: string | null; avatar_url: string };
let authMeInFlight: Promise<AdminAuthUser | null> | null = null;

export function useAdminAuth() {
  const user = useState<AdminAuthUser | null>("admin-user", () => null);
  const loading = useState<boolean>("admin-loading", () => true);
  const initialized = useState<boolean>("admin-auth-initialized", () => false);

  async function fetchUser(opts?: { force?: boolean }) {
    const force = !!opts?.force;
    if (!force) {
      if (authMeInFlight) return authMeInFlight;
      if (initialized.value) {
        loading.value = false;
        return user.value;
      }
    }
    loading.value = true;
    authMeInFlight = (async () => {
      try {
        const data = await $fetch<AdminAuthUser | null>("/api/admin/auth/me");
        user.value = data;
        initialized.value = true;
        return data;
      } catch {
        user.value = null;
        initialized.value = true;
        return null;
      } finally {
        loading.value = false;
        authMeInFlight = null;
      }
    })();
    return authMeInFlight;
  }

  function login() {
    window.location.href = "/api/admin/auth/login";
  }

  async function logout() {
    await $fetch("/api/admin/auth/logout", { method: "POST" });
    user.value = null;
    initialized.value = true;
    window.location.href = "/admin";
  }

  onMounted(() => {
    if (!initialized.value) {
      void fetchUser();
    }
  });

  return { user, loading, fetchUser, login, logout };
}
