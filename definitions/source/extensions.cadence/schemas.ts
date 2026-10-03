import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'
import type { Annotation, Declaration, Pulse, Schedule } from './types.ts'

const path = resolve(import.meta.dirname, '../../schemas/extensions.cadence')
const namespace = schemas.namespace(path)

export const declaration: Schema<Declaration> = namespace.schema('declaration')
export const pulse: Schema<Pulse> = namespace.schema('pulse')
export const schedule: Schema<Schedule> = namespace.schema('schedule')
export const annotation: Schema<Annotation> = namespace.schema('annotation')
