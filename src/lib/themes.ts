export type ThemeId = "atelier" | "market" | "studio" | "grove" | "sunset" | "aurora" | "midnight" | "forest";

export const themes: Record<ThemeId, { name: string; description: string; colors: { background: string; foreground: string; primary: string; accent: string }; font: string; layout: "editorial" | "grid" | "minimal" | "organic" }> = {
  atelier: { name: "Atelier", description: "Warm, editorial and considered", colors: { background: "#f8f5ef", foreground: "#28251f", primary: "#7b583f", accent: "#efe4d7" }, font: "var(--font-bodoni), Georgia, serif", layout: "editorial" },
  market: { name: "Market Day", description: "Bright, welcoming and easy to browse", colors: { background: "#fffdf7", foreground: "#27342d", primary: "#17745b", accent: "#e3f2e9" }, font: "var(--font-dm-sans), system-ui, sans-serif", layout: "grid" },
  studio: { name: "Studio", description: "Crisp, modern and product-first", colors: { background: "#f4f5f7", foreground: "#20242d", primary: "#454bc1", accent: "#e4e6ff" }, font: "var(--font-manrope), system-ui, sans-serif", layout: "minimal" },
  grove: { name: "Grove", description: "Natural, calm and handmade", colors: { background: "#f4f6ef", foreground: "#253126", primary: "#526b43", accent: "#e5eadc" }, font: "var(--font-dm-sans), system-ui, sans-serif", layout: "organic" },
  sunset: { name: "Sunset", description: "Warm, expressive and golden-hour inspired", colors: { background: "#fff6f0", foreground: "#39261f", primary: "#bd5439", accent: "#f5ddd0" }, font: "var(--font-bodoni), Georgia, serif", layout: "editorial" },
  aurora: { name: "Aurora", description: "Fresh, luminous and quietly colorful", colors: { background: "#f3f8f7", foreground: "#173039", primary: "#267987", accent: "#d9eeeb" }, font: "var(--font-dm-sans), system-ui, sans-serif", layout: "grid" },
  midnight: { name: "Midnight", description: "Dark, modern and high-contrast", colors: { background: "#121a22", foreground: "#f0f3f5", primary: "#a7d77c", accent: "#253541" }, font: "var(--font-manrope), system-ui, sans-serif", layout: "minimal" },
  forest: { name: "Forest", description: "Grounded, botanical and calm", colors: { background: "#f2f5ed", foreground: "#263526", primary: "#45633f", accent: "#dfe9d5" }, font: "var(--font-dm-sans), system-ui, sans-serif", layout: "organic" },
};
