import { Locator } from '@toa.io/core/types'

declare namespace toa.pointer {

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
  } | string

}

export type URIs = toa.pointer.URIs

export const construct: toa.pointer.uris.Constructor
export const resolve: toa.pointer.uris.Resolver
