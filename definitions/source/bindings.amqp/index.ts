import type { bindings } from '@toa.io/core/types'

export const properties: bindings.Properties = { async: true }

export { deployment } from './deployment.js'
export { ID as CONTEXT, VARIABLE as CONTEXT_VARIABLE } from './context.js'
export { ID as SOURCES } from './sources.js'

export type { Annotation, Declaration } from './annotation.js'
