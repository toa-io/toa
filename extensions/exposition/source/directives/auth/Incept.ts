import assert from 'node:assert'
import { type Maybe } from '@toa.io/types'
import * as http from '../../HTTP'
import { type Directive, type Discovery, type Identity, type Context, type Schemes } from './types'
import { split } from './split'
import { create } from './create'
import { PROVIDERS } from './schemes'

export class Incept implements Directive {
  private readonly property: string | null
  private readonly discovery: Discovery
  private readonly schemes: Schemes = {} as unknown as Schemes

  public constructor (property: string, discovery: Discovery) {
    assert.ok(property === null || typeof property === 'string',
      '`auth:incept` value must be a string or null')

    this.property = property
    this.discovery = discovery
  }

  public authorize (identity: Identity | null, context: Context): boolean {
    return identity === null && 'authorization' in context.request.headers
  }

  public reply (context: Context): http.OutgoingMessage | null {
    if (this.property !== null)
      return null

    const body = create(context.request.headers.authorization)

    return { body }
  }

  public async settle (context: Context, response: http.OutgoingMessage): Promise<void> {
    const id = response.body?.[this.property ?? 'id']

    if (id === undefined)
      throw new http.Conflict('Identity inception has failed as the response body ' +
        `does not contain the '${this.property}' property`)

    const [scheme, credentials] = split(context.request.headers.authorization!)
    const provider = PROVIDERS[scheme]

    this.schemes[scheme] ??= await this.discovery[provider]

    const identity = await this.schemes[scheme]
      .invoke<Maybe<Identity>>('incept', {
      input: {
        authority: context.authority,
        id,
        credentials
      }
    })

    if (identity instanceof Error)
      throw new http.UnprocessableEntity(identity)

    context.identity = identity
    context.identity.scheme = scheme
  }
}
