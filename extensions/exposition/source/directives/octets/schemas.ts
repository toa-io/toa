import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Options as GetOptions } from './Get.ts'
import type { Options as PutOptions } from './Put.ts'
import type { Options as DeleteOptions } from './Delete.ts'
import type { Schema } from '@toa.io/schemas'
import type { Unit } from './workflows/index.ts'

const path = resolve(import.meta.dirname, '../../../schemas/octets')
const namespace = schemas.namespace(path)

export const put: Schema<PutOptions | null> = namespace.schema('put')
export const get: Schema<GetOptions | null> = namespace.schema('get')
export const remove: Schema<DeleteOptions | null> = namespace.schema('delete')
export const workflow: Schema<Unit[] | Unit> = namespace.schema('workflow')
