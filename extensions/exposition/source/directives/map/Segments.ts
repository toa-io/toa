import assert from 'node:assert'
import { Mapping } from './Mapping.js'
import { take } from '../../Introspection.js'
import type { Parameter } from '../../RTD/index.js'
import type { Introspection, Schema } from '../../Introspection.js'

export class Segments extends Mapping<Record<string, string>> {
  public constructor (map: Record<string, string>) {
    assert.ok(map.constructor === Object, '`map:segments` must be an object')

    assert.ok(Object.values(map).every((value) => typeof value === 'string'),
      '`map:segments ` must be an object with string values')

    super(map)
  }

  /** A segment is the caller's, so it moves to the route rather than out of sight. */
  public override explain (introspection: Introspection): void {
    for (const property of Object.keys(this.value)) {
      const schema = take(introspection, property)

      introspection.route ??= {}
      introspection.route[property] = schema ?? ({ type: 'string' } as unknown as Schema)
    }
  }

  public override properties (_: unknown, parameters: Parameter[]): Record<string, string> {
    return Object.entries(this.value).reduce((properties: Record<string, string>, [property, parameter]) => {
      const cut = parameter[0] === '~'

      if (cut) parameter = parameter.slice(1)

      const index = parameters.findIndex(({ name }) => name === parameter)

      assert.ok(index > -1, `Route parameter '${parameter}' is missing`)

      properties[property] = parameters[index].value

      if (cut)
        parameters.splice(index, 1)

      return properties
    }, {})
  }
}
