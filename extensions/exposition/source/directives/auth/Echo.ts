import { newid } from '@toa.io/generic'
import type { OutgoingMessage } from '../../HTTP'
import type { Directive, Identity, Input } from './types'

export class Echo implements Directive {
  public authorize (identity: Identity | null, input: Input): boolean {
    if (identity === null && 'authorization' in input.request.headers)
      return false

    input.identity ??= this.create()

    return true
  }

  public reply (identity: Identity | null): OutgoingMessage {
    const body = identity!

    return body.scheme === null
      ? { status: 201, body }
      : { body }
  }

  private create (): Identity {
    return { id: newid(), scheme: null, refresh: false, roles: [] }
  }
}
