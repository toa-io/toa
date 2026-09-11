import { id } from './id.ts'
import { get } from './get.ts'
import { set } from './set.ts'
import { basic } from './basic.ts'
import { email } from './email.ts'
export { email } from './email.ts'
import { password } from './password.ts'
export { password } from './password.ts'
import { now } from './now.ts'
import { utc } from './utc.ts'
import { unix } from './unix.ts'
import { print } from './print.ts'
import type { Captures } from '../Captures.ts'

export const functions: Functions = {
  id,
  get,
  set,
  basic,
  email,
  password,
  now,
  utc,
  unix,
  print
}

type Fn = (this: Captures, value: string, ...args: string[]) => string

export type Functions = Record<string, Fn>
