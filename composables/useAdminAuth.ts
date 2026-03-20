type AdminAuthUser = { login: string; name: string | null; avatar_url: string };
let authMeInFlight: Promise<AdminAuthUser | null> | null = null;

export function useAdminAuth() {
  const user = useState<AdminAuthUser | null>("admin-user", () => null);
  const loading = useState<boolean>("admin-loading", () => true);
  const initialized = useState<boolean>("admin-auth-initialized", () => false);
  const authError = useState<string | null>("admin-auth-error", () => null);

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
        authError.value = null;
        initialized.value = true;
        return data;
      } catch (e: unknown) {
        const err = (e as { statusCode?: number; data?: { message?: string }; message?: string }) || {};
        if (err.statusCode === 403) {
          authError.value =
            err.data?.message ||
            err.message ||
            "您沒有此儲存庫的寫入權限，請改用具有 write access 的 GitHub 帳號。";
        } else {
          authError.value = null;
        }
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
    authError.value = null;
    window.location.href = "/api/admin/auth/login";
  }

  async function logout() {
    await $fetch("/api/admin/auth/logout", { method: "POST" });
    user.value = null;
    authError.value = null;
    initialized.value = true;
    window.location.href = "/admin";
  }

  onMounted(() => {
    if (!initialized.value) {
      void fetchUser();
    }
  });

  return { user, loading, authError, fetchUser, login, logout };
}
