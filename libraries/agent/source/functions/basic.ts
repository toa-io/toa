import type { Captures } from '../Captures'

export function basic (this: Captures, _: string, user: string): string {
  const username = this.get(`${user}.username`)
  const password = this.get(`${user}.password`)

  return Buffer.from(`${username}:${password}`).toString('base64')
}
