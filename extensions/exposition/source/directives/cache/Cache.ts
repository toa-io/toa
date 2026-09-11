import { Control } from './Control.ts'
import { Exact } from './Exact.ts'
import { matches, tag } from './etag.ts'
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

    validate(context, response, response.headers, safe)

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
}

/**
 * The validators a reply carries: the timestamp as `last-modified`, whatever the method, and
 * on a safe one the version as its `etag`. A client that sends the tag back in `if-none-match`
 * already has the representation and is told so, with the tag as it sent it. A reply without
 * a version has no tag: nothing identifies it but its body, and hashing that on every reply
 * is what a version is for.
 */
// eslint-disable-next-line max-params
function validate(
  context: AuthenticatedContext,
  response: http.OutgoingMessage,
  headers: Headers,
  safe: boolean
): void {
  const { version, modified } = response

  if (modified !== undefined)
    headers.set('last-modified', new Date(modified).toUTCString())

  if (version === undefined || !safe) return

  const sent = context.request.headers['if-none-match']

  if (sent !== undefined && matches(sent, version)) {
    response.status = 304
    response.body = undefined
    headers.set('etag', sent)
  } else headers.set('etag', tag(version))
}

const constructors: Record<string, new (value: any) => Directive> = {
  control: Control,
  exact: Exact
}
