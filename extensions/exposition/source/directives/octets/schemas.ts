import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'

const path = resolve(__dirname, '../../../schemas/octets')
const namespace = schemas.namespace(path)

export const context = namespace.schema('context')
export const store = namespace.schema('store')
export const fetch = namespace.schema('fetch')
export const remove = namespace.schema('delete')
export const list = namespace.schema('list')
export const permute = namespace.schema('permute')
