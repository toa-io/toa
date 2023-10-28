import * as core from '@toa.io/core'
import * as composition from './composition'

export * as bindings from './bindings'

export async function composition (paths: string[], options?: composition.Options): Promise<core.Connector>

export async function remote (locator: core.Locator): Promise<core.Component>

export async function receive<T = any> (
  label: string,
  receiver: Receiver,
): Promise<core.Connector>

export async function receive<T = any> (
  label: string,
  group: string | undefined,
  receiver: Receiver,
): Promise<core.Connector>

type Receiver = { receive: (message: core.Message<T>) => void | Promise<void> }
