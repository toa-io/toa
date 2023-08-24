import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'

const path = resolve(__dirname, '../../schemas')
const namespace = schemas.namespace(path)

export const node = namespace.schema('node')
export const querystring = namespace.schema('querystring')
