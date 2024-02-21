import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'
import type { Permissions as FetchPermissions } from './Fetch'
import type { Permissions as ListPermissions } from './List'
import type { Options as StoreOptions } from './Store'
import type { Options as DeleteOptions } from './Delete'
import type { Schema } from '@toa.io/schemas'

const path = resolve(__dirname, '../../../schemas/octets')
const namespace = schemas.namespace(path)

export const context: Schema<string> = namespace.schema('context')
export const store: Schema<StoreOptions | null> = namespace.schema('store')
export const fetch: Schema<FetchPermissions | null> = namespace.schema('fetch')
export const remove: Schema<DeleteOptions | null> = namespace.schema('delete')
export const list: Schema<ListPermissions | null> = namespace.schema('list')
export const permute: Schema<null> = namespace.schema('permute')
