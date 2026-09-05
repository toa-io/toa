import type * as core from '@toa.io/core'
import type * as types from '@toa.io/core/types'
import * as composition from './composition.js'

export * as bindings from './bindings.js'

export async function composition (paths: string[], options?: composition.Options): Promise<core.Connector>

export async function remote (locator: core.Locator, source?: types.Source): Promise<core.Remote>

export async function receive<T = any> (
  label: string,
  receiver: Receiver
): Promise<core.Connector>

export async function receive<T = any> (
  label: string,
  group: string | undefined,
  receiver: Receiver
): Promise<core.Connector>

type Receiver = { receive: (message: types.Message<T>) => void | Promise<void> }

export function host (): types.extensions.Host
