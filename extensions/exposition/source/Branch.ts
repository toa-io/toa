import type * as RTD from './RTD/syntax'

export interface Branch {
  namespace: string
  component: string
  node: RTD.Node
}
