/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                // Custom Fonts
                chomsky: ['Chomsky', 'serif'],
                pirata: ['Pirata One', 'cursive'],
                sans: ['ui-sans-serif', 'system-ui', 'sans-serif'], // Default override if needed
            },
            colors: {
                // Brand Colors can be added here
                brand: {
                    black: '#000000',
                    white: '#FFFFFF',
                    gold: '#D4AF37', // Example accent
                }
            },
            animation: {
                marquee: 'marquee 60s linear infinite',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                }
            }
        },
    },
    plugins: [],
}
