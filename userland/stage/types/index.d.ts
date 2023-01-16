import * as _core from '@toa.io/core/types'
import * as _norm from '@toa.io/norm/types'

declare namespace toa.stage {
  type Manifest = (path: string) => Promise<_norm.Component>
  type Component = (path: string) => Promise<_core.Component>
  type Composition = (paths: string[]) => Promise<void>
  type Remote = (id: string) => Promise<_core.Component>
  type Shutdown = () => Promise<void>

  interface Stage {
    manifest: toa.stage.Manifest
    component: toa.stage.Component
    composition: toa.stage.Composition
    remote: toa.stage.Remote
    shutdown: toa.stage.Shutdown
  }
}

export type Stage = toa.stage.Stage

export const manifest: toa.stage.Manifest
export const component: toa.stage.Component
export const composition: toa.stage.Composition
export const remote: toa.stage.Remote
export const shutdown: toa.stage.Shutdown

export * as binding from './binding'
