import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'
import type { Options as FetchOptions } from './Fetch'
import type { Options as ListOptions } from './List'
import type { Options as StoreOptions } from './Store'
import type { Options as DeleteOptions } from './Delete'
import type { Schema } from '@toa.io/schemas'
import type { Unit } from './workflows'

const path = resolve(__dirname, '../../../schemas/octets')
const namespace = schemas.namespace(path)

export const store: Schema<StoreOptions | null> = namespace.schema('store')
export const fetch: Schema<FetchOptions | null> = namespace.schema('fetch')
export const remove: Schema<DeleteOptions | null> = namespace.schema('delete')
export const list: Schema<ListOptions | null> = namespace.schema('list')
export const workflow: Schema<Unit[] | Unit> = namespace.schema('workflow')
