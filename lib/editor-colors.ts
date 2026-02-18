/**
 * Preset colour palette for the editor Font colour toolbar.
 * One row per hue (red → grey), 5 shades each (light to dark).
 * Classes align with rehype-span-attributes and .post-content CSS.
 */
export type EditorColorPreset = {
  class: string;
  hex: string;
  label?: string;
};

export type EditorColorRow = {
  hue: string;
  label: string;
  presets: EditorColorPreset[];
};

/** One row per hue, 5 shades per row (1 = lightest, 5 = darkest). */
const ROWS: { hue: string; label: string; shades: [string, string, string, string, string] }[] = [
  { hue: "red", label: "紅", shades: ["#fecaca", "#f87171", "#dc2626", "#b91c1c", "#7f1d1d"] },
  { hue: "orange", label: "橙", shades: ["#fed7aa", "#fb923c", "#ea580c", "#c2410c", "#9a3412"] },
  { hue: "yellow", label: "黃", shades: ["#fef08a", "#facc15", "#eab308", "#ca8a04", "#a16207"] },
  { hue: "green", label: "綠", shades: ["#bbf7d0", "#4ade80", "#22c55e", "#16a34a", "#15803d"] },
  { hue: "teal", label: "青", shades: ["#99f6e4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e"] },
  { hue: "blue", label: "藍", shades: ["#bfdbfe", "#60a5fa", "#2563eb", "#1d4ed8", "#1e3a8a"] },
  { hue: "purple", label: "紫", shades: ["#e9d5ff", "#c084fc", "#a855f7", "#7c3aed", "#6b21a8"] },
  { hue: "pink", label: "粉", shades: ["#fbcfe8", "#f472b6", "#ec4899", "#db2777", "#be185d"] },
  { hue: "grey", label: "灰", shades: ["#e5e7eb", "#9ca3af", "#6b7280", "#4b5563", "#374151"] },
];

export const EDITOR_COLOR_ROWS: EditorColorRow[] = ROWS.map(({ hue, label, shades }) => ({
  hue,
  label,
  presets: shades.map((hex, i) => ({
    class: `${hue}-${i + 1}`,
    hex,
    label: `${label} ${i + 1}`,
  })),
}));

/** Flat list of all presets (e.g. for CSS generation or fallback). */
export const EDITOR_COLOR_PRESETS: EditorColorPreset[] = EDITOR_COLOR_ROWS.flatMap((row) => row.presets);
