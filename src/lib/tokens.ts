export const tokens = {
  colors: {
    background: "#0F0F10",
    surface: "#1C1C1E",
    border: "#2C2C2E",
    text: "#FFFFFF",
    textMuted: "#8E8E93",
    accent: "#52B5B4",
    accentPressed: "#439A99",

    // Category specific colors (background and text/border)
    category: {
      movement: {
        bg: "rgba(76, 217, 100, 0.15)",
        text: "#4CD964",
      },
      breath: {
        bg: "rgba(90, 200, 250, 0.15)",
        text: "#5AC8FA",
      },
      reflection: {
        bg: "rgba(255, 149, 0, 0.15)",
        text: "#FF9500",
      },
      rest: {
        bg: "rgba(175, 82, 222, 0.15)",
        text: "#AF52DE",
      },
    },

    // Static system colors
    success: "#4CD964",
    error: "#FF3B30",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    card: 16,
    control: 8,
    badge: 6,
  },
  font: {
    size: {
      caption: 12,
      body: 14,
      title: 18,
      display: 32,
    },
    weight: {
      regular: "400" as const,
      medium: "500" as const,
      bold: "700" as const,
    },
  },
};

export type Tokens = typeof tokens;
