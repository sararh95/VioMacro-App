/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // VioMacro Design Tokens - Lilac/Purple Palette
                // Dark Mode (Primary)
                "primary": "#A78BFA",           // violet-400 - CTAs, active states
                "primary-hover": "#8B5CF6",     // violet-500 - hover states
                "primary-dark": "#7C3AED",      // violet-600 - for light mode
                "background-dark": "#1E1B2E",   // Main dark background
                "sidebar-dark": "#16132B",      // Sidebar background
                "surface-dark": "#252238",      // Cards, panels
                "surface-border": "#3D3655",    // Borders dark mode
                "text-secondary": "#A8A3B8",    // Body text dark mode

                // Light Mode
                "background-light": "#F9F8FC",  // Main light background
                "surface-light": "#FFFFFF",     // Cards light mode
                "surface-border-light": "#E4E0ED", // Borders light mode
                "text-secondary-light": "#6B6880", // Body text light mode
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "sans": ["Inter", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "full": "9999px",
            },
        },
    },
    plugins: [],
}
