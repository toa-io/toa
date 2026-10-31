import transformLucideImports from 'vite-plugin-transform-lucide-imports'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import config from './kit.config.ts'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(config), transformLucideImports()],
})
