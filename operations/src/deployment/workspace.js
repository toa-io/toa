import { mkdir, mkdtemp, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

/**
 * @param {string} type
 * @param {string} [path]
 * @return {Promise<string>}
 */
export async function create (type, path) {
  if (path === undefined) return await mkdtemp(join(tmpdir(), 'toa-' + type))

  path = resolve(path)

  await mkdir(path, { recursive: true })

  const entries = await readdir(path)

  if (entries.length > 0) throw new Error('Target directory must be empty')

  return path
}
