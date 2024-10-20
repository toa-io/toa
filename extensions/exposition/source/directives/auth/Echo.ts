import { create } from './create'
import type { OutgoingMessage } from '../../HTTP'
import type { Directive, Identity, Input } from './types'

export class Echo implements Directive {
  public authorize (identity: Identity | null, input: Input): boolean {
    if (identity === null && 'authorization' in input.request.headers)
      return false

    input.identity ??= create()

    return true
  }

  public reply (context: Input): OutgoingMessage {
    const body = context.identity!

    return body.scheme === null
      ? { status: 201, body }
      : { body }
  }
}
