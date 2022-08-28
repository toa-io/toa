import { Underlay } from '@toa.io/libraries/generic/types'
import { Connector } from "@toa.io/core/types";

declare namespace toa.node {

  interface Annexes {
    [key: string]: Function
  }

  interface Context extends Connector {
    local: Underlay
    remote: Underlay
    annexes: Annexes

    // known extensions
    origins?: Underlay
  }

}

export type Context = toa.node.Context
