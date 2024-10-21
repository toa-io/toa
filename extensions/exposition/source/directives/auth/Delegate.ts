import { BadRequest } from '../../HTTP'
import { Role } from './Role'
import type { Context, Directive, Identity } from './types'
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
