export const Colors = {
  light: {
    // Structural
    background: "#f6f8fa",
    surface: "#ffffff", // Cards, modals, input backgrounds
    border: "#d0d7de",

    // Typography
    text: "#24292f", // Primary headings and body
    textMuted: "#57606a", // Secondary text, timestamps

    // Actions & States
    primary: "#0969da", // Main buttons, active tabs
    primaryMuted: "#ddeeff", // Background for active items
    danger: "#cf222e", // Delete buttons, error states
    success: "#1a7f37", // Save success, online indicators

    // Code specific
    codeBackground: "#eff1f3",
  },
  dark: {
    // Structural
    background: "#0d1117",
    surface: "#161b22",
    border: "#30363d",

    // Typography
    text: "#c9d1d9",
    textMuted: "#8b949e",

    // Actions & States
    primary: "#58a6ff",
    primaryMuted: "#1f3a5f",
    danger: "#f85149",
    success: "#2ea043",

    // Code specific
    codeBackground: "#010409",
  },
};

export type Theme = "light" | "dark";
export type ColorTheme = typeof Colors.light;
