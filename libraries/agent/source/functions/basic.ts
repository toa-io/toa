import * as gen from './index.js'
import type { Captures } from '../Captures.js'

export function basic (this: Captures, _: string, user: string): string {
  const username = this.get(`${user}.username`) ?? gen.email()
  const password = this.get(`${user}.password`) ?? gen.password()

  return Buffer.from(`${username}:${password}`).toString('base64')
}
