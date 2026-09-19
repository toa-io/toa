/**
 * A first-party package's definition, by the reference a manifest or a context names it by.
 * `undefined` for a package this one does not define, which norm then reads on its own.
 */
export async function definition(reference: string): Promise<object | undefined> {
  if (!reference.startsWith(SCOPE)) return undefined

  // `package#key` is a declaration of its own that a package claims beside its main one
  const [suffix, key] = reference.slice(SCOPE.length).split('#')

  if (!DEFINED.has(suffix)) return undefined

  cache[suffix] ??= import(`./${suffix}/index.ts`)

  const module = await cache[suffix]

  if (key === undefined) return module

  const keyed = (module as { keys?: Record<string, object> }).keys?.[key]

  if (keyed === undefined)
    throw new Error(`'${reference}' names a key that '${SCOPE}${suffix}' does not claim`)

  return keyed
}

const cache: Record<string, Promise<object>> = {}

const SCOPE = '@toa.io/'

/** Every package defined here, by its directory, which is its name within the scope. */
export const DEFINED: ReadonlySet<string> = new Set([
  'bindings.amqp',
  'bindings.http',
  'bindings.loop',
  'bridges.bash',
  'bridges.node',
  'extensions.cadence',
  'extensions.configuration',
  'extensions.convergence',
  'extensions.exposition',
  'extensions.fetch',
  'extensions.introspection',
  'extensions.stash',
  'extensions.state',
  'extensions.storages',
  'extensions.telemetry',
  'storages.mongodb'
])
