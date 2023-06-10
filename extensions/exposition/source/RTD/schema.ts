import { join } from 'node:path'
import schemas from '@toa.io/schemas'

const path = join(__dirname, 'schema.cos.yaml')

export const schema = schemas.schema(path)
