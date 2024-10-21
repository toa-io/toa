import { create } from './create'
import type { OutgoingMessage } from '../../HTTP'
import type { Directive, Identity, Context } from './types'

export class Echo implements Directive {
  public authorize (identity: Identity | null, context: Context): boolean {
    if (identity === null && 'authorization' in context.request.headers)
      return false

    context.identity ??= create()

    return true
  }

  public reply (context: Context): OutgoingMessage {
    const body = context.identity!

    return body.scheme === null
      ? { status: 201, body }
      : { body }
  }
}
