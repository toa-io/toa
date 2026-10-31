import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-static'

import type { Config } from '@sveltejs/kit/vite'

const config: Config = {
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

  alias: {
    $ui: './src/lib/components/ui',
    $com: './src/lib/components',
    $lib: './src/lib',
    $config: './src/config',
    $origin: './src/origin',
    '@': './src/@',
  },
}

export default config
