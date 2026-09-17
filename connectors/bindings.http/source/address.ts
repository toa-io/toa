import { environment } from '@toa.io/generic'
import { PORT, VARIABLE } from '@toa.io/definitions/bindings.http'
import type { Locator } from '@toa.io/core'

/**
 * Where a component answers a streamed call: what the context states for it, or the service a
 * deployment renders for it, which is what an unstated address resolves to.
 */
export function address(locator: Locator): URL {
  return new URL(stated(locator) ?? `http://${locator.hostname()}:${PORT}`)
}

/**
 * The port a process serving this component listens on, which is the one in the component's own
 * address: one line says where a component is, and both sides read it.
 */
export function port(locator: Locator): number {
  const url = address(locator)

  return url.port === '' ? PORT : Number(url.port)
}

/** The deepest key that names this component, as a context states one for all of them. */
function stated(locator: Locator): string | undefined {
  const value = environment.get(VARIABLE)

  if (value === undefined) return undefined

  const map = JSON.parse(value) as Record<string, string>
  const namespace = locator.namespace

  const broader = namespace === undefined ? undefined : map[namespace]

  return map[locator.id] ?? broader ?? map['.']
}
