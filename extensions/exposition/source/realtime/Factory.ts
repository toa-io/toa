import { environment } from '@toa.io/generic'
import {
  parse,
  ROUTES,
  type Declaration,
  type Route
} from '@toa.io/definitions/extensions.exposition/realtime'
import { Destination } from './Destination.ts'
import type { Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'

/**
 * What every component has of realtime: the destination its routed events are written by. A
 * component that routes nothing has none, and is not given an outbox for it.
 */
export class Factory implements extensions.Factory {
  public destination(
    locator: Locator,
    declaration: Declaration | null
  ): Destination | undefined {
    const routes = resolve(locator, declaration)

    if (routes.length === 0) return undefined

    return new Destination(locator, routes)
  }
}

/**
 * The routes the deployment resolved for the component — its manifest's and the context's — or,
 * where nothing was deployed, the manifest's own.
 */
function resolve(locator: Locator, declaration: Declaration | null): Route[] {
  const value = environment.get(ROUTES + locator.uppercase)

  if (value !== undefined) return JSON.parse(value) as Route[]

  return declaration === null || declaration === undefined ? [] : parse(declaration)
}
