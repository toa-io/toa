import { id } from './id'
import { set } from './set'
import { basic } from './basic'
import { password } from './password'

import type { Captures } from '../Captures'

export const functions: Record<string, (this: Captures, value: string, ...args: string[]) => string> = {
  id, set, basic, password
}
