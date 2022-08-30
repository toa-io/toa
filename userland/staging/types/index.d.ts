import * as _core from '@toa.io/core/types'

declare namespace toa.userland.staging {

  type Component = (path: string) => Promise<_core.Component>
  type Shutdown = () => Promise<void>

}

export const component: toa.userland.staging.Component
export const shutdown: toa.userland.staging.Shutdown
