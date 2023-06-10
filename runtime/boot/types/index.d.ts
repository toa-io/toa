import * as core from '@toa.io/core'
import * as composition from './composition'

export * as bindings from './bindings'

export const composition: (paths: string[], options: composition.Options) => Promise<core.Connector>
