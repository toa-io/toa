/**
 * A first-party package's definition, by the reference a manifest or a context names it by.
 * `undefined` for a package this one does not define, which norm then reads on its own.
 */
export async function definition(reference: string): Promise<object | undefined> {
  if (!reference.startsWith(SCOPE)) return undefined

  const suffix = reference.slice(SCOPE.length)

  if (!DEFINED.has(suffix)) return undefined

  cache[suffix] ??= import(`./${suffix}/index.js`)

  return cache[suffix]
}

const cache: Record<string, Promise<object>> = {}

const SCOPE = '@toa.io/'

/** Every package defined here, by its directory, which is its name within the scope. */
export const DEFINED: ReadonlySet<string> = new Set([
  'bindings.amqp',
  'bindings.loop',
  'bridges.bash',
  'extensions.cadence',
  'extensions.configuration',
  'extensions.exposition',
  'extensions.fetch',
  'extensions.introspection',
  'extensions.realtime',
  'extensions.stash',
  'extensions.state',
  'extensions.storages',
  'extensions.telemetry',
  'storages.mongodb'
])
