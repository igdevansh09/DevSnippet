export const Colors = {
  light: {
    background: "#ffffff",
    surface: "#f4f4f5",
    border: "#e4e4e7",
    text: "#09090b",
    textMuted: "#71717a",
    primary: "#ff5a00", 
    primaryMuted: "#ffedd5",
    danger: "#ef4444",
    success: "#10b981",
    codeBackground: "#f4f4f5",
  },
  dark: {
    background: "#000000",
    surface: "#121212",
    border: "#27272a",
    text: "#ffffff",
    textMuted: "#a1a1aa",
    primary: "#ff5a00",
    primaryMuted: "#431407",
    danger: "#f87171",
    success: "#34d399",
    codeBackground: "#09090b",
  },
};

export type Theme = "light" | "dark";
export type ColorTheme = typeof Colors.light;
