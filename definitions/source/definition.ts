/** A first-party package's definition, loaded by the reference a manifest or a context names it by. */
export async function definition(reference: string): Promise<object | undefined> {
  const load = TABLE[reference]

  if (load === undefined) return undefined

  cache[reference] ??= load()

  return cache[reference]
}

const cache: Record<string, Promise<object>> = {}

const TABLE: Record<string, () => Promise<object>> = {}
