import type * as RTD from './RTD'

export type Context = RTD.Context<Extension>

interface Extension {
  namespace: string
  component: string
}
