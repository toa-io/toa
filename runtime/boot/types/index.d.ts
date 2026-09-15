import type * as core from '@toa.io/core'
import type * as types from '@toa.io/core/types'
import type * as norm from '@toa.io/norm/types'
import * as composition from './composition.d.ts'

export * as bindings from './bindings.d.ts'

export async function manifest(
  path: string,
  options?: composition.Options
): Promise<norm.Manifest>

/** What this process was given about the components it calls. */
export namespace map {
  /** the file to read it from, or the map itself */
  function use(value: string | Record<string, core.Contract> | undefined): void

  /** what this process composes, stated by the boot that composes it */
  function compose(manifests: norm.Manifest[]): void

  function contract(id: string): Promise<core.Contract | undefined>
}

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

export function host(): types.extensions.Host

/** A process, as a connector: what the command built, and what the extensions keep in one. */
export class Workload extends core.Connector {
  constructor(build: (workload: Workload) => Promise<core.Connector>)

  /** A part of this process a halt takes down and builds again. */
  gate(build: () => Promise<core.Connector>): core.Gate

  /** Whether what a halt takes down is up. */
  running(): boolean

  /** Whether this process is quiet: it does nothing of its own accord and holds everything. */
  quiescent(): boolean

  /** Stops what this process does of its own accord, holding open everything it has. */
  quiesce(): Promise<void>

  /** Undoes a quiesce. */
  cancel(): Promise<void>

  /** Stops this process for `seconds`, then builds it again. */
  stop(seconds: number): void
}
