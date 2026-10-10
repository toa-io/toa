import { readdirSync } from 'node:fs'
import { join } from 'node:path'

// the binary of this project's Toa, by its path: pm2 resolves a script through the PATH of the
// shell that starts it, which has `node_modules/.bin` only under `npm run`
const toa = join(import.meta.dirname, 'node_modules/.bin/toa')

const components = readdirSync(join(import.meta.dirname, 'components'), {
  withFileTypes: true
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => join('components', entry.name))

const common = {
  script: toa,
  cwd: import.meta.dirname,
  autorestart: false,
  watch: false,
  merge_logs: true,
  wait_ready: true,
  listen_timeout: 60_000
}

export const apps = [
  // what Toa serves beside an application: its gateway, configuration and introspection
  { ...common, name: 'sys', args: 'serve configuration exposition introspection' },
  // the application's components
  { ...common, name: 'app', args: `compose ${components.join(' ')}` }
]
