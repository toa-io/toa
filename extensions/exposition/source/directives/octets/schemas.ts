import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'
import type { Options as GetOptions } from './Get'
import type { Options as PutOptions } from './Put'
import type { Options as DeleteOptions } from './Delete'
import type { Schema } from '@toa.io/schemas'
import type { Unit } from './workflows'

const path = resolve(__dirname, '../../../schemas/octets')
const namespace = schemas.namespace(path)

export const put: Schema<PutOptions | null> = namespace.schema('put')
export const get: Schema<GetOptions | null> = namespace.schema('get')
export const remove: Schema<DeleteOptions | null> = namespace.schema('delete')
export const workflow: Schema<Unit[] | Unit> = namespace.schema('workflow')
