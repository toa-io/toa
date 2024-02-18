import { resolve } from 'node:path'
import { namespace } from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'
import type { Annotation } from './Annotation'

const path = resolve(__dirname, '../schemas')
const ns = namespace(path)

export const annotation: Schema<Annotation> = ns.schema<Annotation>('annotation')
