import { Locator } from '@toa.io/core/types'

declare namespace toa.annotations {

  namespace uris {

    type Node = {
      [key: string]: string
    }

    type Constructor = (declaration: URIs | string) => URIs

    type Resolver = (uris: URIs, locator: Locator) => URL

  }

  type URIs = {
    default?: string
    [key: string]: string | uris.Node
  }

}

export const construct: toa.annotations.uris.Constructor
export const resolve: toa.annotations.uris.Resolver
