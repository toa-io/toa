import { Underlay } from '@toa.io/libraries/generic/types'
import { Connector } from "@toa.io/core/types";

declare namespace toa.node {

  interface Extensions {
    [key: string]: Function
  }

  interface Context extends Connector {
    local: Underlay
    remote: Underlay
    extensions: Extensions

    // known extensions
    origins?: Underlay
  }

}

export type Context = toa.node.Context
