// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

import react from '@astrojs/react';

// https://astro.build/config
// Trigger reload
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  site: "https://slccuts.es",
  output: 'server',

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [react()],
  image: {
    domains: ["images.unsplash.com", "fwecgvsfbxzzobjkklul.supabase.co"]
  },
  security: {
    checkOrigin: true
  }
});