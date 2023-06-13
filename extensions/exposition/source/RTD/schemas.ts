import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'

const path = resolve(__dirname, '../../schemas')
const namespace = schemas.namespace(path)

export const branch = namespace.schema('branch')
