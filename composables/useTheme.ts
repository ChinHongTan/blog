export const useTheme = () => {
	const theme = useState<"light" | "dark">("theme", () => "light");

	const applyTheme = (newTheme: "light" | "dark") => {
		if (import.meta.client) {
			const root = document.documentElement;
			if (newTheme === "dark") root.classList.add("dark");
			else root.classList.remove("dark");
			localStorage.setItem("theme", newTheme);
		}
	};

	const setTheme = (newTheme: "light" | "dark") => {
		theme.value = newTheme;
		applyTheme(newTheme);
	};

	const toggleTheme = () => {
		setTheme(theme.value === "dark" ? "light" : "dark");
	};

	const initTheme = () => {
		if (import.meta.client) {
			let initial: "light" | "dark" = "light";
			try {
				const saved = localStorage.getItem("theme") as "light" | "dark" | null;
				if (saved === "dark" || saved === "light") {
					initial = saved;
				} else if (
					window.matchMedia &&
					window.matchMedia("(prefers-color-scheme: dark)").matches
				) {
					initial = "dark";
				}
			} catch {
				// ignore
			}
			setTheme(initial);
		}
	};

	return {
		theme,
		toggleTheme,
		setTheme,
		initTheme,
	};
};
