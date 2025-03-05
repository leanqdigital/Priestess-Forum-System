tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-200": "var(--primary-200)",
        "primary-100": "var(--primary-100)",
        "primary-300": "var(--primary-300)",
        "primary-400": "var(--primary-400)",

        secondary: "var(--secondary)",
        "secondary-100": "var(--secondary-100)",
        "secondary-200": "var(--secondary-200)",
        "secondary-300": "var(--secondary-300)",

        danger: {
          100: "var(--danger-100)",
          200: "var(--danger-200)",
          300: "var(--danger-300)",
        },

        success: {
          100: "var(--success-100)",
          200: "var(--success-200)",
          300: "var(--success-300)",
        },

        warning: {
          100: "var(--warning-100)",
          200: "var(--warning-200)",
          300: "var(--warning-300)",
        },

        grey: {
          DEFAULT: "var(--grey)",
          100: "var(--grey-100)",
          200: "var(--grey-200)",
          300: "var(--grey-300)",
        },
      },
    },
  },
};
