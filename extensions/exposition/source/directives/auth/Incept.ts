import assert from 'node:assert'
import { console } from 'openspan'
import * as http from '../../HTTP/index.js'
import { split } from './split.js'
import { create } from './create.js'
import { INCEPTION, UNKNOWN, providers as providersOf } from './schemes.js'
import { Role } from './Role.js'
import type { Component } from '@toa.io/core'
import type { Maybe } from '@toa.io/core'
import type { Directive, Discovery, Identity, Context, Components, Ban } from './types.js'

export class Incept implements Directive {
  private static readonly components: Components = {}
  private static discovery: Discovery
  private static bans: Component | null = null

  private readonly property: string | null

  public constructor (property: string, discovery: Discovery) {
    assert.ok(property === null || typeof property === 'string',
      '`auth:incept` value must be a string or null')

    this.property = property
    Incept.discovery ??= discovery
  }

  public static async incept (context: Context, id: string): Promise<Identity> {
    const [scheme, credentials] = split(context.request.headers.authorization!)
    const candidates = providersOf(scheme)

    if (candidates === undefined)
      throw new http.BadRequest('Authentication scheme is not supported')

    // a scheme several providers claim is incepted by the one that incepts; `Bearer`
    // carries an access token this gateway issued, and an identity cannot be incepted
    // from a credential it would itself have to exist to hold
    const provider = candidates.find((candidate) => INCEPTION.includes(candidate))

    if (provider === undefined)
      throw new http.Unauthorized()

    Incept.bans ??= await Incept.discovery.bans

    const ban = await Incept.bans.invoke<Ban>('observe', { query: { id } })

    if (ban.banned)
      throw new http.Unauthorized()

    Incept.components[provider] ??= await Incept.discovery[provider]

    const identity = await Incept.components[provider]!.invoke<Maybe<Identity>>('incept', {
      input: {
        scheme,
        authority: context.authority,
        id,
        credentials
      }
    })

    if (identity instanceof Error)
      throw new http.UnprocessableEntity(identity)

    identity.scheme = scheme
    identity.roles = []

    return identity
  }

  /** Credentials that were rejected for any reason but being unknown are not incepted. */
  public static acceptable (context: Context): boolean {
    return context.request.headers.authorization === undefined || context.rejection === UNKNOWN
  }

  public authorize (identity: Identity | null, context: Context): boolean {
    return identity === null && Incept.acceptable(context)
  }

  public reply (context: Context): http.OutgoingMessage | null {
    if (this.property !== null)
      return null

    const body = create(context.request.headers.authorization)

    return { body }
  }

  public async settle (context: Context, response: http.OutgoingMessage): Promise<void> {
    const id = response.body?.[this.property ?? 'id']

    if (id === undefined) {
      console.debug('Inception skipped: response does not contain expected property', {
        property: this.property,
        response
      })

      return
    }

    assert(typeof id === 'string', `Response body property "${this.property}" expected to be a string`)

    if (context.request.headers.authorization !== undefined)
      context.identity = await Incept.incept(context, id)
    else {
      const identity = { id, scheme: null, refresh: true }
      const roles = await Role.get(identity, Incept.discovery.roles)

      context.identity = { ...identity, roles }
    }
  }
}
