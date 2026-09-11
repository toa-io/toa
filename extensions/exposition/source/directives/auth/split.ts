import * as http from '../../HTTP/index.ts'
import { type Scheme } from './types.ts'

export function split(authorization: string): [Scheme, string] {
  const space = authorization.indexOf(' ')

  if (space === -1) throw new http.Unauthorized('Malformed authorization header')

  const Scheme = authorization.slice(0, space)
  const scheme = Scheme.toLowerCase() as Scheme
  const value = authorization.slice(space + 1)

  return [scheme, value]
}
