import { readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

/**
 * A component's modules by name, whatever extension each was written with.
 *
 * Two files that resolve to one name are a conflict rather than a race: which of them a scan
 * reached first is not something a component may depend on.
 */
export async function sources(root: string, directory: string): Promise<Map<string, string>> {
  const path = join(root, directory)
  const files = (await list(path)).filter((file) => EXTENSIONS.has(extname(file))).sort()
  const modules = new Map<string, string>()

  // sorted, so the two files a conflict names are the same two on every machine
  for (const file of files) {
    const name = basename(file, extname(file))
    const found = modules.get(name)

    if (found !== undefined)
      throw new Error(
        `Component at '${root}' has more than one ${directory}/${name}: ` +
          `${basename(found)} and ${file}`
      )

    modules.set(name, join(path, file))
  }

  return modules
}

async function list(path: string): Promise<string[]> {
  try {
    const entries = await readdir(path, { withFileTypes: true })

    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  } catch (error: any) {
    if (error.code === 'ENOENT') return []

    throw error
  }
}

const EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts'])
