import { id } from './id'
import { set } from './set'
import { basic } from './basic'
import { email } from './email'
import { password } from './password'
import type { Captures } from '../Captures'

export const functions: Functions = {
  id, set, basic, email, password
}

type Fn = (this: Captures, value: string, ...args: string[]) => string

export type Functions = Record<string, Fn>
