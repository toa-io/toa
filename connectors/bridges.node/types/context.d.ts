import { Underlay } from '@toa.io/generic/types'
import { Connector } from '@toa.io/core'
import { Aspect } from '@toa.io/core/types/extensions'
import type { FetchInit } from '@toa.io/extensions.fetch'

declare namespace toa.node{

  interface Context extends Connector{
    local: Underlay
    remote: Underlay
    aspects: Record<string, Function>

    // known extensions
    fetch: (input: string | URL | Request, init?: FetchInit) => Promise<Response>
    amqp?: Underlay
    configuration?: object
    state?: object
  }

  type shortcut = (context: Context, aspect: Aspect) => void

}

export type Context = toa.node.Context
