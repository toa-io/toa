import assert from 'node:assert'
import { cors } from '../cors/index.js'
import { Mapping } from './Mapping.js'
import { take } from '../../Introspection.js'
import type { Input } from '../../io.js'
import type { Introspection } from '../../Introspection.js'

/**
 * Forbidden request header names: the browser sets them itself and a script cannot
 * list them in `Access-Control-Request-Headers`, so there is nothing to advertise
 * or vary on. The value is still read, it just never reaches CORS.
 */
const FORBIDDEN = new Set(['host', 'origin'])

export class Headers extends Mapping<Record<string, string>> {
  private readonly headers: string[]

  public constructor (map: Record<string, string>) {
    assert.ok(map.constructor === Object, '`map:headers` must be an object')

    assert.ok(Object.values(map).every((value) => typeof value === 'string'),
      '`map:headers` must be an object with string values')

    super(map)

    this.headers = Object.values(map).filter((header) => !FORBIDDEN.has(header))
    this.headers.forEach((header) => cors.allow(header))
  }

  public override explain (introspection: Introspection): void {
    for (const [property, header] of Object.entries(this.value)) {
      const schema = take(introspection, property)

      introspection.headers ??= {}
      introspection.headers[property] = { ...schema, header }
    }
  }

  public properties (context: Input): Record<string, string> {
    context.pipelines.response.push((response) => {
      response.headers ??= new global.Headers()

      for (const header of this.headers)
        response.headers.append('vary', header)
    })

    return Object.entries(this.value).reduce((properties: Record<string, string>, [property, header]) => {
      const value = context.request.headers[header]

      if (value !== undefined)
        properties[property] = Array.isArray(value) ? value.join(', ') : value

      return properties
    }, {})
  }
}
