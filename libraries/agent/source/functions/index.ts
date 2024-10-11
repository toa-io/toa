import { id } from './id'
import { get } from './get'
import { set } from './set'
import { basic } from './basic'
import { email } from './email'
import { password } from './password'
import { now } from './now'
import { iso } from './iso'
import { print } from './print'
import type { Captures } from '../Captures'

export const functions: Functions = {
  id, get, set, basic, email, password, now, iso, print
}

type Fn = (this: Captures, value: string, ...args: string[]) => string

export type Functions = Record<string, Fn>

export {
  email,
  password
}
