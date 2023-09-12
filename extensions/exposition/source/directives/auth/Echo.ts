import { type OutgoingMessage } from '../../HTTP'
import { type Directive, type Identity } from './types'

export class Echo implements Directive {
  public authorize (identity: Identity | null): boolean {
    return identity !== null
  }

  public reply (identity: Identity | null): OutgoingMessage {
    return { body: identity }
  }
}
