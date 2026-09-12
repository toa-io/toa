import { Control } from './Control.ts'
import { Exact } from './Exact.ts'
import { same, tag } from './etag.ts'
import type { Output } from '../../io.ts'
import type { AuthenticatedContext, Directive } from './types.ts'
import type { DirectiveFamily } from '../../RTD/index.ts'
import type * as http from '../../HTTP/index.ts'

export class Cache implements DirectiveFamily<Directive> {
  public readonly name: string = 'cache'
  public readonly mandatory: boolean = true

  public create(name: string, value: any): Directive {
    const Class = constructors[name]

    if (Class === undefined)
      throw new Error(`Directive 'cache:${name}' is not implemented`)

    return new Class(value)
  }

  public precall(): Output {
    return null
  }

  public async settle(
    directives: Directive[],
    context: AuthenticatedContext,
    response: http.OutgoingMessage
  ): Promise<void> {
    const directive = directives[0]
    const method = context.request.method
    const safe = method === 'GET' || method === 'HEAD'

    response.headers ??= new Headers()

    // `cache:exact` sets what it is given, whatever the method: whether a reply may be
    // stored at all is not a question about the method's cacheability, and a token
    // endpoint answers a POST it must not have kept
    if (directive instanceof Exact) {
      directive.set(context, response.headers)

      return
    }

    if (!safe) return

    if (directive === undefined) {
      if (context.identity !== null && !Control.disabled(response.headers)) {
        response.headers.set('cache-control', 'private')
        response.headers.append('vary', 'authorization')
      }
    } else directive.set(context, response.headers)
  }

  /**
   * What the reply is validated by, which is the body it holds. Request-scoped, because the
   * body is the whole request's: one that made several calls sends back one of them.
   *
   * The tag is formed for a safe method (`GET`, `HEAD`) whose reply the client may store, and
   * for no other: a client never sends a tag back on a write, and a reply stating `no-store`
   * it can never send back at all. A directive that stated a tag of its own — the checksum of
   * a stored file — keeps it. The body is bytes only once it is encoded, so what is left here
   * is what forms the tag out of them.
   */
  public depart(context: http.Context, response: http.OutgoingMessage): void {
    const method = context.request.method

    if (method !== 'GET' && method !== 'HEAD') return

    const headers = response.headers

    if (headers !== undefined && (headers.has('etag') || Control.disabled(headers)))
      return

    response.validate = (body: Buffer) => {
      const etag = tag(body)
      const sent = context.request.headers['if-none-match']

      return { etag, held: sent !== undefined && same(sent, etag) }
    }
  }
}

const constructors: Record<string, new (value: any) => Directive> = {
  control: Control,
  exact: Exact
}
