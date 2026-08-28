import type * as RTD from './RTD'

// the trunk is built from the context annotation and belongs to no branch,
// thus its endpoints must be fully qualified and are not versioned
export type Context = RTD.Context<Extension | undefined>

interface Extension {
  namespace: string
  component: string
  version: string
}
