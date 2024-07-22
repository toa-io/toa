import type * as RTD from './RTD/syntax'

export interface Branch {
  namespace: string
  component: string
  isolated: boolean
  node: RTD.Node
  version: string
}
