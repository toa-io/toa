import type * as _deployment from './deployment.d.ts'

declare namespace toa.deployment {
  interface Composition extends _deployment.Deployable {
    components: Array<string>
    replicas?: number
  }
}

export type Composition = toa.deployment.Composition
