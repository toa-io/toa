import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'

const path = resolve(__dirname, '../../schemas')
const namespace = schemas.namespace(path)

export const manifest = namespace.schema('manifest')
export const annotation = namespace.schema('annotation')
