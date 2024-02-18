import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'

const path = resolve(__dirname, '../schemas')
const namespace = schemas.namespace(path)

export const manifest: Schema<any> = namespace.schema('manifest')
export const annotation: Schema<any> = namespace.schema('annotation')
