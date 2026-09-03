import { existsSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { dirname, join, parse } from 'node:path'

/**
 * A component is copied into the image on its own, away from the package that
 * declared what its files are. Node reads a `.js` as CommonJS unless a manifest
 * beside it says otherwise, so the one the component was written under is
 * restated where it lands.
 *
 * A component that ships its own manifest already says so, and is left alone.
 *
 * @param {string} source the component in the workspace
 * @param {string} target where it was copied
 * @param {string} name
 */
export async function declare (source, target, name) {
  if (existsSync(join(target, MANIFEST))) return

  await writeFile(join(target, MANIFEST),
    JSON.stringify({ name, private: true, type: format(source) }, null, 2) + '\n')
}

/**
 * The module format a directory's files are read as, which the nearest manifest
 * above it decides.
 *
 * @param {string} directory
 * @returns {'module' | 'commonjs'}
 */
export function format (directory) {
  const { root } = parse(directory)

  let current = directory

  while (current !== root) {
    const manifest = join(current, MANIFEST)

    if (existsSync(manifest))
      return JSON.parse(readFileSync(manifest, 'utf8')).type === 'module' ? 'module' : 'commonjs'

    current = dirname(current)
  }

  return 'commonjs'
}

const MANIFEST = 'package.json'
