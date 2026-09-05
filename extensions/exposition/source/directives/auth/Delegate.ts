import { BadRequest } from '../../HTTP/index.js'
import { take } from '../../Introspection.js'
import { Role } from './Role.js'
import type { Introspection } from '../../Introspection.js'
import type { Context, Directive, Identity } from './types.js'
import type { Component } from '@toa.io/core'

export class Delegate implements Directive {
  private readonly property: string
  private readonly discovery: Promise<Component>

  public constructor (property: string, discovery: Promise<Component>) {
    this.property = property
    this.discovery = discovery
  }

  public async authorize (identity: Identity | null, context: Context): Promise<boolean> {
    if (identity === null)
      return false

    identity.roles ??= await Role.get(identity, this.discovery)
    context.pipelines.body.push((body) => this.embed(body, identity))

    return true
  }

  /** It admits whoever there is, and embedding the identity is the request's business. */
  public admits (identity: Identity | null): boolean {
    return identity !== null
  }

  /** The property it embeds is the identity's, so a caller has nothing to put there. */
  public describe (introspection: Introspection): Introspection {
    take(introspection, this.property)

    return introspection
  }

  private embed (body: unknown, identity: Identity): Record<string, unknown> {
    if (body === undefined)
      body = {}

    check(body)
    body[this.property] = structuredClone(identity)

    return body
  }
}

function check (body: unknown): asserts body is Record<string, unknown> {
  if (typeof body !== 'object' || body === null)
    throw new BadRequest('Invalid request body')
}
