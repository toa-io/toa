import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'
import type { Declaration } from './types.ts'

const path = resolve(import.meta.dirname, '../../schemas/extensions.telemetry')
const namespace = schemas.namespace(path)

export const declaration: Schema<Declaration> = namespace.schema('declaration')
