import { create } from './create.js'
import type { OutgoingMessage } from '../../HTTP/index.js'
import type { Directive, Identity, Context } from './types.js'

export class Echo implements Directive {
  public authorize (identity: Identity | null, context: Context): boolean {
    if (identity === null && 'authorization' in context.request.headers)
      return false

    context.identity ??= create()

    return true
  }

  /** What `authorize` answers, without inventing the identity it would go on to invent. */
  public admits (identity: Identity | null, context: Context): boolean {
    return !(identity === null && 'authorization' in context.request.headers)
  }

  public reply (context: Context): OutgoingMessage {
    const body = context.identity!

    return body.scheme === null
      ? { status: 201, body }
      : { body }
  }
}
