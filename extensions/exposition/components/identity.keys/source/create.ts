import { V3 } from 'paseto'
import type { Operation } from '@toa.io/types'

export class Transition implements Operation {
  public async execute (input: Input, object: Key): Promise<Output> {
    object.key = await V3.generateKey('local', { format: 'paserk' })
    object.identity = input.identity
    object.name = input.name

    return { id: object.id, key: object.key }
  }
}

interface Input {
  identity: string
  name: string
}

interface Output {
  id: string
  key: string
}

interface Key {
  id: string
  identity: string
  key: string
  name: string
}
