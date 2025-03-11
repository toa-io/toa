import { resolve } from 'node:path'
import schemas, { type Schema } from '@toa.io/schemas'
import type { Annotation } from './Annotation'

const path = resolve(__dirname, '../schemas')
const namespace = schemas.namespace(path)

export const annotation: Schema<Annotation> = namespace.schema('annotation')
