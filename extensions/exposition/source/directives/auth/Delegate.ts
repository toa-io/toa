import { BadRequest } from '../../HTTP'
import { type Directive, type Identity } from './types'
import type { Input } from '../../io'

export class Delegate implements Directive {
  private readonly property: string

  public constructor (property: string) {
    this.property = property
  }

  public authorize (identity: Identity | null, context: Input): boolean {
    if (identity === null)
      return false

    context.pipelines.body.push((body) => this.embed(body, identity))

    return true
  }

  private embed (body: unknown, identity: Identity): Record<string, unknown> {
    check(body)
    body[this.property] = identity

    return body
  }
}

function check (body: unknown): asserts body is Record<string, unknown> {
  if (typeof body !== 'object' || body === null)
    throw new BadRequest('Invalid request body.')
}
