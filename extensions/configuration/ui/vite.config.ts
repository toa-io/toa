import transformLucideImports from 'vite-plugin-transform-lucide-imports'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { sveltekit } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-static'

export default defineConfig({
  // what the server build renders is the fallback, and nothing of it ships to map back to
  environments: { ssr: { build: { sourcemap: false } } },
  plugins: [
    tailwindcss(),
    sveltekit({
      // Consult https://svelte.dev/docs/kit/integrations
      // for more information about preprocessors
      preprocess: vitePreprocess(),

      // A directory of files, nothing more: the explorer serves `dist` and the client owns
      // routing, so every route resolves to the fallback.
      adapter: adapter({ pages: 'dist', assets: 'dist', fallback: 'index.html' }),

      // The ingress forwards the mount path rather than rewriting it, and the client router
      // matches against `base` — so the path the extension publishes is baked in here.
      // `relative` is off because the fallback answers URLs of any depth.
      paths: { base: '/.configuration', relative: false },
    }),
    transformLucideImports(),
  ],
})
