import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'

const path = resolve(__dirname, '../schemas/querystring.cos.yaml')

export const querystring = schemas.schema(path)
