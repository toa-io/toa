import { resolve } from 'node:path'
import schemas, { type Schema } from '@toa.io/schemas'
import type { Permissions as InputPermissions } from './Input'
import type { Permissions as OutputPermissions } from './Output'
import type { Message } from './Message'

const path = resolve(__dirname, '../../../schemas/io')
const namespace = schemas.namespace(path)

export const message: Schema<Message | Message[]> = namespace.schema('message')
export const input: Schema<InputPermissions> = namespace.schema('input')
export const output: Schema<OutputPermissions> = namespace.schema('output')
