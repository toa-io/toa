import { join } from 'node:path'
import schemas from '@toa.io/schemas'

export const schema = schemas.schema(join(__dirname, 'schema.cos.yaml'))
