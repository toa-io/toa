import type { bindings } from '@toa.io/core/types'

export const properties: bindings.Properties = { async: true }

export { deployment } from './deployment.ts'
export { ID as CONTEXT, VARIABLE as CONTEXT_VARIABLE } from './context.ts'
export { ID as SOURCES } from './sources.ts'

export type { Annotation, Declaration } from './annotation.ts'
