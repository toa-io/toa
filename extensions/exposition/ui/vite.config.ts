import { readFileSync } from 'node:fs'
import transformLucideImports from 'vite-plugin-transform-lucide-imports'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
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
  plugins: [sign(), tailwindcss(), sveltekit(), transformLucideImports()],
})
