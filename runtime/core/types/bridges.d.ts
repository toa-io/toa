import type * as reply from './reply'
import type * as context from './context'
import type * as connector from './connector'

declare namespace toa.core.bridges {

  interface Algorithm extends connector.Connector {
    run(input: Object, state: Object | Object[]): Promise<reply.Reply>
  }

  interface Factory {
    algorithm(path: string, name: string, context: context.Context): Algorithm

    event(path: string, label: string): any

    receiver(path: string, label: string): any
  }

}

export type Algorithm = toa.core.bridges.Algorithm
export type Factory = toa.core.bridges.Factory
