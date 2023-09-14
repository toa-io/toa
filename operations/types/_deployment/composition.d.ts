import type * as _deployment from './deployment'

declare namespace toa.deployment {

  interface Composition extends _deployment.Deployable {
    components: Array<string>
  }

}

export type Composition = toa.deployment.Composition
