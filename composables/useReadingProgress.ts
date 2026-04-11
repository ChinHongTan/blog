import { onBeforeUnmount, onMounted, ref, unref, watch, type MaybeRef, type Ref } from "vue";

type UseReadingProgressOptions = {
	isEnabled: MaybeRef<boolean>;
	pagePath: MaybeRef<string | undefined>;
	scrollPercentage: Ref<number>;
};

const READING_KEY_PREFIX = "reading-progress:";

export function useReadingProgress(options: UseReadingProgressOptions) {
	const showResumeBar = ref(false);
	const savedScrollPercent = ref(0);
	let savedScrollY = 0;
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	function getStorageKey(): string | null {
		if (!unref(options.isEnabled)) return null;
		const path = unref(options.pagePath);
		if (!path) return null;
		return READING_KEY_PREFIX + path;
	}

	function saveReadingProgress() {
		if (typeof window === "undefined") return;
		const key = getStorageKey();
		if (!key) return;
		const pct = options.scrollPercentage.value;
		if (pct < 5 || pct > 95) return;
		localStorage.setItem(
			key,
			JSON.stringify({ scrollY: window.scrollY, percent: Math.round(pct) }),
		);
	}

	function debouncedSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(saveReadingProgress, 2000);
	}

	function resumeReading() {
		if (typeof window === "undefined") return;
		window.scrollTo({ top: savedScrollY, behavior: "smooth" });
		showResumeBar.value = false;
	}

	function dismissResume() {
		showResumeBar.value = false;
		const key = getStorageKey();
		if (key) localStorage.removeItem(key);
	}

	// Auto-dismiss the resume bar once the reader has scrolled past the
	// saved position — the prompt is answered by the act of continuing.
	watch(options.scrollPercentage, (current) => {
		if (showResumeBar.value && current >= savedScrollPercent.value) {
			showResumeBar.value = false;
		}
	});

	onMounted(() => {
		if (typeof window === "undefined") return;
		const key = getStorageKey();
		if (!key) return;

		const raw = localStorage.getItem(key);
		if (raw) {
			try {
				const data = JSON.parse(raw) as {
					percent?: number;
					scrollY?: number;
				};
				if ((data.percent ?? 0) > 5 && (data.scrollY ?? 0) > 200) {
					savedScrollY = data.scrollY as number;
					savedScrollPercent.value = data.percent as number;
					showResumeBar.value = true;
				}
			} catch {
				/* ignore invalid payload */
			}
		}

		window.addEventListener("scroll", debouncedSave, { passive: true });
	});

	onBeforeUnmount(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener("scroll", debouncedSave);
		}
		if (saveTimer) clearTimeout(saveTimer);
		saveReadingProgress();
	});

	return {
		showResumeBar,
		savedScrollPercent,
		resumeReading,
		dismissResume,
	};
}
