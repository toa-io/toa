import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * @param {string} name
 */
const cli = async (name) => {
  const path = join(ROOT, name)
  const module = await import(pathToFileURL(path).href)

  return module[name]
}

const require = createRequire(import.meta.url)
const ROOT = join(dirname(require.resolve('@toa.io/cli')), 'handlers')

export { cli }
