import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'
import type { Permissions as InputPermissions } from './Input.ts'
import type { Permissions as OutputPermissions } from './Output.ts'
import type { Declaration as ThrottleDeclaration } from './lib/throttle/index.ts'

import type { Message } from './Message.ts'

const path = resolve(import.meta.dirname, '../../../schemas/io')
const namespace = schemas.namespace(path)

export const message: Schema<Message | Message[]> = namespace.schema('message')
export const input: Schema<InputPermissions> = namespace.schema('input')
export const output: Schema<OutputPermissions> = namespace.schema('output')
export const throttle: Schema<ThrottleDeclaration> = namespace.schema('throttle')
