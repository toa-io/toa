import {
  parse,
  type Declaration
} from '@toa.io/definitions/extensions.exposition/realtime'
import { Destination } from './Destination.ts'
import type { Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'

/**
 * What `@toa.io/extensions.exposition#realtime` is to a component that declares routes: the
 * destination its routed events are written by.
 */
export class Realtime implements extensions.Factory {
  public destination(
    locator: Locator,
    declaration: Declaration | null
  ): Destination | undefined {
    const routes =
      declaration === null || declaration === undefined ? [] : parse(declaration)

    if (routes.length === 0) return undefined

    return new Destination(locator, routes)
  }
}
