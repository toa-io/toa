import type * as _core from '@toa.io/core'
import * as _norm from '@toa.io/norm/types'
import * as _composition from '@toa.io/boot/types/composition'
import type * as _boot from '@toa.io/boot'

export function manifest(path: string): Promise<_norm.Component>

export function component(path: string): Promise<_core.Component>

export function composition(
  paths: string[],
  options?: _composition.Options
): Promise<void>

export function compose(paths: string[]): Promise<void>

/** the same components as a process runs them: behind a gate, with the residents beside */
export function workload(
  paths: string[],
  options?: _composition.Options,
  services?: string[]
): Promise<_boot.Workload>

export function serve(ref: string): Promise<_core.Component>

export function remote(id: string): Promise<_core.Component>

export function shutdown(): Promise<void>
