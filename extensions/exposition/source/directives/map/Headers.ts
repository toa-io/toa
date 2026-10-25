import { Mapping } from './Mapping.ts'
import { take } from '../../Introspection.ts'
import type { Input } from '../../io.ts'
import type { Introspection } from '../../Introspection.ts'

/**
 * A cache keys a reply by its URL, the host in it, so there is nothing to vary on. The value
 * is still read.
 */
const KEYED = new Set(['host'])

export class Headers extends Mapping<Record<string, string>> {
  private readonly headers: string[]

  public constructor(map: Record<string, string>) {
    if (map.constructor !== Object) throw new Error('`map:headers` must be an object')

    if (!Object.values(map).every((value) => typeof value === 'string'))
      throw new Error('`map:headers` must be an object with string values')

    super(map)

    this.headers = Object.values(map).filter((header) => !KEYED.has(header))
  }

  /**
   * The property is filled from a request header, so it is not the body's to send. Which
   * header, and that there is one at all, is not answered: what an application reads off a
   * request is its own, and a caller has nowhere to put one anyway.
   */
  public override explain(introspection: Introspection): void {
    for (const property of Object.keys(this.value)) take(introspection, property)
  }

  /** A header the request does not have is a property it has none of, whatever the body says. */
  public properties(context: Input): Record<string, string | undefined> {
    context.pipelines.response.push((response) => {
      response.headers ??= new global.Headers()

      for (const header of this.headers) response.headers.append('vary', header)
    })

    return Object.entries(this.value).reduce(
      (properties: Record<string, string | undefined>, [property, header]) => {
        const value = context.request.headers[header]

        properties[property] = Array.isArray(value) ? value.join(', ') : value

        return properties
      },
      {}
    )
  }
}
