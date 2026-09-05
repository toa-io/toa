import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'
import type { Annotation, Declaration } from './types.js'

const path = resolve(import.meta.dirname, '../schemas')
const namespace = schemas.namespace(path)

export const declaration: Schema<Declaration> = namespace.schema('declaration')
export const annotation: Schema<Annotation> = namespace.schema('annotation')
