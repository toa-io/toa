import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Query } from './HTTP/index.js'
import type { Node } from './RTD/index.js'
import type { Call } from './RPC/types.js'
import type { Schema } from '@toa.io/schemas'
import type { Annotation } from './Annotation.js'

const path = resolve(import.meta.dirname, '../schemas')
const namespace = schemas.namespace(path)

export const querystring: Schema<Query> = namespace.schema('querystring')
export const annotation: Schema<Annotation> = namespace.schema('annotation')
export const node: Schema<Node> = namespace.schema('node')
export const call: Schema<Call> = namespace.schema('call')
