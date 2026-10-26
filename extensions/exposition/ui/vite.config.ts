import { readFileSync } from 'node:fs'
import transformLucideImports from 'vite-plugin-transform-lucide-imports'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { sveltekit } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-static'
import type { ServerResponse } from 'node:http'

/*
 * Vite answers the page's own origin, so it has to sign replies the way the gateway does —
 * otherwise the footer has nothing to print. The built `dist` is served by the gateway,
 * which sets this itself.
 */
const exposition = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version

function sign(): Plugin {
  return {
    name: 'exposition-dev-header',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        stamp(res)
        next()
      })
    },
  }
}

function stamp(res: ServerResponse): void {
  const writeHead = res.writeHead.bind(res)

  res.writeHead = ((...args: Parameters<typeof res.writeHead>) => {
    res.setHeader('exposition', exposition)

    return writeHead(...args)
  }) as typeof res.writeHead

  res.setHeader('exposition', exposition)
}

export default defineConfig({
  // what the server build renders is the fallback, and nothing of it ships to map back to
  environments: { ssr: { build: { sourcemap: false } } },
  plugins: [
    sign(),
    tailwindcss(),
    sveltekit({
      // Consult https://svelte.dev/docs/kit/integrations
      // for more information about preprocessors
      preprocess: vitePreprocess(),

      // A directory of files, nothing more: the gateway serves `dist` and the client owns
      // routing, so every route resolves to the fallback.
      adapter: adapter({ pages: 'dist', assets: 'dist', fallback: 'index.html' }),

      // The gateway serves this under a pinned prefix and the client router matches
      // against `base` — so the path the extension publishes is baked in here.
      // `relative` is off because the fallback answers URLs of any depth.
      paths: { base: '/.discovery', relative: false },
    }),
    transformLucideImports(),
  ],
})
