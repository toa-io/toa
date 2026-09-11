import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-static'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // A directory of files, nothing more: the explorer serves `dist` and the client owns
    // routing, so every route resolves to the fallback.
    adapter: adapter({ pages: 'dist', assets: 'dist', fallback: 'index.html' }),

    // The ingress forwards the mount path rather than rewriting it, and the client router
    // matches against `base` — so the path the extension publishes is baked in here.
    // `relative` is off because the fallback answers URLs of any depth.
    paths: { base: '/.introspection', relative: false },

    alias: {
      $ui: './src/lib/components/ui',
      $com: './src/lib/components',
      $lib: './src/lib',
      $config: './src/config',
      $origin: './src/origin',
      '@': './src/@',
    },
    typescript: {
      config: (config) => {
        config.include.push('../features/**/*.ts')
      },
    },
  },
}

export default config
