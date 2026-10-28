import assert from 'node:assert'
import { BadRequest } from '../../HTTP/index.ts'
import { take } from '../../Introspection.ts'
import type { Introspection } from '../../Introspection.ts'
import type { OutgoingMessage } from '../../HTTP/index.ts'
import type { Context, Directive, Identity } from './types.ts'

/**
 * The `authorization` header, given to the operation unread as a property of its input: the
 * caller authenticates as itself, with a credential that is not the gateway's to verify, and
 * whoever presents one is admitted. The credential is not authenticated at all (see
 * `Authorization.preflight`), so the call has no identity.
 */
export class Transfer implements Directive {
  public readonly property: string

  public constructor(property: unknown) {
    assert.ok(
      typeof property === 'string' && property.length > 0,
      "Directive 'auth:transfer' names the property the credential is given to"
    )

    this.property = property
  }

  /**
   * A procedure's credential is its caller's own, which the gateway has authenticated, and
   * no method's to read.
   */
  public authorize(_: Identity | null, context: Context): boolean {
    if (context.procedural) return false

    const credential = context.request.headers.authorization

    if (credential !== undefined)
      context.pipelines.body.push((body) => this.embed(body, credential))

    return true
  }

  public admits(_: Identity | null, context: Context): boolean {
    return !context.procedural
  }

  /** The property is the header's, so a caller has nothing to put there. */
  public describe(introspection: Introspection): Introspection {
    take(introspection, this.property)

    return introspection
  }

  /** What answers a credential is never the answer to another. */
  public async settle(_: Context, response: OutgoingMessage): Promise<void> {
    response.headers ??= new Headers()
    response.headers.set('cache-control', 'no-store')
  }

  /** A body taken as it arrived (`map:buffer`, `map:stream`) is none here, as it is to `map`. */
  private embed(body: unknown, credential: string): Record<string, unknown> {
    if (body === undefined || body === null) body = {}

    if (typeof body !== 'object' || body === null)
      throw new BadRequest('Invalid request body')

    const input = body as Record<string, unknown>

    input[this.property] = credential

    return input
  }
}
