import type { Shortcuts } from './syntax/index.ts'

/** What a directive may be written as, where the family is implied. */
export const shortcuts: Shortcuts = new Map([
  ['anonymous', 'auth:anonymous'],
  ['anyone', 'auth:anyone'],
  ['id', 'auth:id'],
  ['role', 'auth:role'],
  ['rule', 'auth:rule'],
  ['incept', 'auth:incept'],
  ['input', 'io:input'],
  ['output', 'io:output'],
  ['languages', 'map:languages']
])
