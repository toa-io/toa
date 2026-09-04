import glob from 'fast-glob'
import { dirname, resolve } from 'node:path'

import { components as generate, types as context } from '../types/index.js'
import { context as find } from '../util/find.js'

export async function types (argv) {
  const written = argv.components === undefined
    ? await whole(argv)
    : await parts(argv.components)

  if (argv.quiet !== true)
    for (const file of written) console.log(file)
}

/** A Context: its own module, and every component in it. */
async function whole (argv) {
  const path = find(argv.path)

  /*
   * A Context is read for an environment, or its `@env` keys stay unresolved and it does not
   * validate. What types are made of does not vary by environment — a schema is a schema — so
   * one is assumed rather than demanded.
   */
  const environment = argv.environment ?? process.env.TOA_ENV ?? 'local'

  return await context(path, environment)
}

/** Components named directly: what Toa and its extensions ship, which belong to no Context. */
async function parts (patterns) {
  const manifests = await glob(patterns.map((pattern) => resolve(pattern, 'manifest.toa.yaml')),
    { onlyFiles: true, absolute: true })

  if (manifests.length === 0) throw new Error(`No component found in ${patterns.join(', ')}`)

  return await generate(manifests.map(dirname))
}
