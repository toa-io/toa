import * as _core from '@toa.io/core/types'
import type * as reply from './reply'
import type * as context from './context'
import type * as connector from './connector'

declare namespace toa.core.bridges {

  interface Algorithm extends connector.Connector {
    mount(context?: context.Context): Promise<void>

    execute(input?: any, scope?: object | object[]): Promise<reply.Reply>
  }

  interface Event {
    condition(object): Promise<boolean>

    payload(object): Promise<object>
  }

  interface Receiver {
    condition(object): Promise<boolean>

    request(object): Promise<_core.Request>
  }

  interface Factory {
    algorithm(path: string, name: string, context: context.Context): Algorithm

    event(path: string, label: string): Event

    receiver(path: string, label: string): Receiver
  }

}

export type Algorithm = toa.core.bridges.Algorithm
export type Factory = toa.core.bridges.Factory
