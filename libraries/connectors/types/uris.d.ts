import { Locator } from '@toa.io/core/types'

declare namespace toa.connectors {

  namespace uris {

    type Node = {
      [key: string]: string | Node
    }

    type Constructor = (declaration: URIs | string) => URIs

    type Resolution = {
      url: URL
      entry: string
    }

    type Resolver = (locator: Locator, uris: URIs) => Resolution

  }

  type URIs = {
    default?: string
    [key: string]: string | uris.Node
  }

}

export type URIs = toa.connectors.URIs

export const construct: toa.connectors.uris.Constructor
export const resolve: toa.connectors.uris.Resolver
