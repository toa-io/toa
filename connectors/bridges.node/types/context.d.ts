import { Underlay } from '@toa.io/generic/types'
import { Connector } from "@toa.io/core/types";

declare namespace toa.node {

  interface Aspectes {
    [key: string]: Function
  }

  interface Context extends Connector {
    local: Underlay
    remote: Underlay
    aspects: Aspectes

    // known extensions
    origins?: Underlay
    configuration?: Underlay
  }

}

export type Context = toa.node.Context
