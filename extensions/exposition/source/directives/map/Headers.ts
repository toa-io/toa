import assert from 'node:assert'
import { cors } from '../cors'
import { Mapping } from './Mapping'
import type { Input } from '../../io'

export class Headers extends Mapping<Record<string, string>> {
  private readonly headers: string[]

  public constructor (map: Record<string, string>) {
    assert.ok(map.constructor === Object, '`map:headers` must be an object')

    assert.ok(Object.values(map).every((value) => typeof value === 'string'),
      '`map:headers` must be an object with string values')

    super(map)

    this.headers = Object.values(map).filter((header) => header !== 'host')
    this.headers.forEach((header) => cors.allow(header))
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
