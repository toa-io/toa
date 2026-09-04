import { types as generate } from '../types/index.js'
import { context as find } from '../util/find.js'

export async function types (argv) {
  const path = find(argv.path)

  /*
   * A Context is read for an environment, or its `@env` keys stay unresolved and it does not
   * validate. What types are made of does not vary by environment — a schema is a schema — so
   * one is assumed rather than demanded.
   */
  const environment = argv.environment ?? process.env.TOA_ENV ?? 'local'
  const written = await generate(path, environment)

  if (argv.quiet !== true)
    for (const file of written) console.log(file)
}
