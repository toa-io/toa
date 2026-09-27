import { randomBytes } from 'node:crypto'
import type { Operation } from '@toa.io/bridges.node'

export class Transition implements Operation {
  public async execute(input: Input, entry: Key): Promise<Output> {
    entry.key = randomBytes(32).toString('base64url')
    entry.identity = input.identity
    entry.label = input.label

    if (input.expires !== undefined) entry.expires = input.expires

    return { id: entry.id, label: entry.label, key: entry.key }
  }
}

interface Input {
  identity: string
  label: string
  expires?: number
}

interface Output {
  id: string
  label: string
  key: string
}

interface Key {
  id: string
  identity: string
  key: string
  label: string
  expires?: number
}
