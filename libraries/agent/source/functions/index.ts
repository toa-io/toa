import { id } from './id.js'
import { get } from './get.js'
import { set } from './set.js'
import { basic } from './basic.js'
import { email } from './email.js'
import { password } from './password.js'
import { now } from './now.js'
import { utc } from './utc.js'
import { unix } from './unix.js'
import { print } from './print.js'
import type { Captures } from '../Captures.js'

export const functions: Functions = {
  id, get, set, basic, email, password, now, utc, unix, print
}

type Fn = (this: Captures, value: string, ...args: string[]) => string

export type Functions = Record<string, Fn>

export {
  email,
  password
}
