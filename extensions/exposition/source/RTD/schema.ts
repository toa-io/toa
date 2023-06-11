import { resolve } from 'node:path'
import schemas from '@toa.io/schemas'

const path = resolve(__dirname, '../../schemas/RTD.node.cos.yaml')

export const schema = schemas.schema(path)
