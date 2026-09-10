import type * as core from '@toa.io/core'
import type * as types from '@toa.io/core/types'
import * as composition from './composition.js'

export * as bindings from './bindings.js'

export async function composition(
  paths: string[],
  options?: composition.Options
): Promise<core.Connector>

export async function remote(
  locator: core.Locator,
  source?: types.Source
): Promise<core.Remote>

export async function receive<T = any>(
  label: string,
  receiver: Receiver
): Promise<core.Connector>

export async function receive<T = any>(
  label: string,
  group: string | undefined,
  receiver: Receiver
): Promise<core.Connector>

type Receiver = { receive: (message: types.Message<T>) => void | Promise<void> }

export function host(workload?: Workload): types.extensions.Host

/**
 * A process, as a connector: what the command built, what the extensions keep in every
 * process, and the gates a halt takes down and builds again.
 */
export class Workload extends core.Connector {
  constructor(build: (workload: Workload) => Promise<core.Connector>)

  /** a part of this tree a halt takes down and builds again */
  gate(build: () => Promise<core.Connector>): core.Gate

  /** stops this process for `seconds`, then builds it again */
  halt(seconds: number): void

  /** whether what a halt takes down is up */
  running(): boolean
}
