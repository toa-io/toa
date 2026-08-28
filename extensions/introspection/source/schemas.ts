import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'
import type { Annotation, Declaration } from './annotation'

const path = resolve(__dirname, '../schemas')
const namespace = schemas.namespace(path)

export const annotation: Schema<Exclude<Annotation, false>> = namespace.schema('annotation')
export const declaration: Schema<Exclude<Declaration, false>> = namespace.schema('declaration')
