import type { bindings } from '@toa.io/core/types'

export const properties: bindings.Properties = { async: false, streams: true }

export { deployment } from './deployment.ts'
export { PORT, VARIABLE, ID } from './const.ts'

export type { Annotation, Declaration } from './annotation.ts'
