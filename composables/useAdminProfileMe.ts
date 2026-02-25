export type AdminProfileMe = {
  login: string;
  name: string | null;
  avatar_url: string;
  authorPath: string | null;
  sha?: string;
  profile: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    banner?: string;
    social?: { github?: string; twitter?: string; website?: string };
    body?: string;
  } | null;
  authorId: string | null;
};

const PROFILE_TTL_MS = 30 * 1000;
let profileMeInFlight: Promise<AdminProfileMe | null> | null = null;

export function useAdminProfileMe() {
  const profileMe = useState<AdminProfileMe | null>("admin-profile-me", () => null);
  const loading = useState<boolean>("admin-profile-me-loading", () => false);
  const fetchedAt = useState<number>("admin-profile-me-fetched-at", () => 0);

  async function fetchProfileMe(opts?: { force?: boolean }) {
    const force = !!opts?.force;
    const fresh = Date.now() - fetchedAt.value < PROFILE_TTL_MS;
    if (!force) {
      if (profileMeInFlight) return profileMeInFlight;
      if (profileMe.value && fresh) return profileMe.value;
    }

    loading.value = true;
    profileMeInFlight = (async () => {
      try {
        const data = await $fetch<AdminProfileMe | null>("/api/admin/profile/me");
        profileMe.value = data;
        fetchedAt.value = Date.now();
        return data;
      } catch {
        profileMe.value = null;
        fetchedAt.value = Date.now();
        return null;
      } finally {
        loading.value = false;
        profileMeInFlight = null;
      }
    })();
    return profileMeInFlight;
  }

  return { profileMe, loading, fetchProfileMe };
}
