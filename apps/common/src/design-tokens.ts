export const brand = {
  colors: {
    primary: "#003366",
    secondary: "#D4AF37",
    background: "#FFFFFF",
    surface: "#F8F9FA",
    text: "#1A1A1A",
    mutedText: "#4D5A66",
    focus: "#005FCC",
    semantic: {
      success: "#2E7D32",
      warning: "#ED6C02",
      error: "#C62828",
      private: "#5B4B8A",
      members: "#00695C",
      public: "#2E7D32",
      audit: "#6A4A00"
    }
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    scale: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.25rem",
      xl: "1.5rem",
      xxl: "2rem"
    }
  },
  motion: {
    duration: {
      fast: "150ms",
      base: "300ms",
      slow: "500ms"
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      celebratory: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
    }
  },
  spacing: {
    unit: "0.25rem",
    scale: [0, 1, 2, 4, 8, 12, 16, 24, 32, 48, 64]
  }
} as const;

export type BrandTokenPath =
  | "colors.primary"
  | "colors.secondary"
  | "colors.background"
  | "colors.surface"
  | "colors.text"
  | "colors.mutedText"
  | "colors.focus"
  | "colors.semantic.success"
  | "colors.semantic.warning"
  | "colors.semantic.error"
  | "colors.semantic.private"
  | "colors.semantic.members"
  | "colors.semantic.public"
  | "colors.semantic.audit";
