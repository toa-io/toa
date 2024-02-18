import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'
import type { Query } from './HTTP'
import type { Node } from './RTD'
import type { Schema } from '@toa.io/schemas'
import type { Annotation } from './Annotation'

const path = resolve(__dirname, '../schemas')
const namespace = schemas.namespace(path)

export const querystring: Schema<Query> = namespace.schema('querystring')
export const annotaion: Schema<Annotation> = namespace.schema('annotation')
export const node: Schema<Node> = namespace.schema('node')
