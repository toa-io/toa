import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'
import type { Node } from './syntax/types.js'
import type { Annotation } from './Annotation.js'

const path = resolve(import.meta.dirname, '../../schemas/extensions.exposition')
const namespace = schemas.namespace(path)

// what the gateway validates a request by, kept beside what a manifest is validated by
export const querystring: Schema<Record<string, unknown>> =
  namespace.schema('querystring')
export const call: Schema<Record<string, unknown>> = namespace.schema('call')

export const annotation: Schema<Annotation> = namespace.schema('annotation')
export const node: Schema<Node> = namespace.schema('node')
