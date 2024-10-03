import { V3 } from 'paseto'
import type { Operation } from '@toa.io/types'

export class Transition implements Operation {
  public async execute (input: Input, object: Key): Promise<Output> {
    object.key = await V3.generateKey('local', { format: 'paserk' })
    object.identity = input.identity
    object.label = input.label

    if (input.expires !== undefined)
      object.expires = input.expires

    return { id: object.id, label: object.label, key: object.key }
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
