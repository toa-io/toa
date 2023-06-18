import * as core from '@toa.io/core'
import * as composition from './composition'

export * as bindings from './bindings'

export async function composition (paths: string[], options?: composition.Options): Promise<core.Connector>

export async function remote (locator: core.Locator): Promise<core.Component>
