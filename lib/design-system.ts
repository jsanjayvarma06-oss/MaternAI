// lib/design-system.ts

export const colors = {
  primary: {
    DEFAULT: "#E8927C", // warm coral
    light: "#FDF0ED",
  },
  secondary: {
    DEFAULT: "#7BB5A2", // soft teal
    light: "#EEF7F4",
  },
  success: {
    DEFAULT: "#6BAE8E", // soft green
  },
  warning: {
    DEFAULT: "#E8B96A", // amber
  },
  danger: {
    DEFAULT: "#D96B6B", // soft red
  },
  background: "#FDFAF8", // warm off-white
  surface: "#FFFFFF",
  text: {
    primary: "#2D2926",
    secondary: "#7A6F6A",
    muted: "#B0A8A4",
  },
};

export const typography = {
  display: "var(--font-fraunces), serif",
  body: "var(--font-plus-jakarta-sans), sans-serif",
  mono: "var(--font-jetbrains-mono), monospace",
};

export const spacing = {
  base: 4, // 4px base grid
  // Can be extended as needed, though Tailwind covers most
};

export const borderRadius = {
  card: "16px",
  button: "12px",
  input: "8px",
};

export const shadows = {
  soft: "0 4px 20px rgba(0, 0, 0, 0.05)",
  softHover: "0 8px 30px rgba(0, 0, 0, 0.08)",
};
