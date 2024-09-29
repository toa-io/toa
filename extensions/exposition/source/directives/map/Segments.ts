import assert from 'node:assert'
import { Mapping } from './Mapping'
import type { Parameter } from '../../RTD'

export class Segments extends Mapping<Record<string, string>> {
  public constructor (map: Record<string, string>) {
    assert.ok(map.constructor === Object, '`map:segments` must be an object')

    assert.ok(Object.values(map).every((value) => typeof value === 'string'),
      '`map:segments ` must be an object with string values')

    super(map)
  }

  public override properties (_: unknown, parameters: Parameter[]): Record<string, string> {
    return Object.entries(this.value).reduce((properties: Record<string, string>, [property, parameter]) => {
      const value = parameters.find(({ name }) => name === parameter)?.value

      assert.ok(value !== undefined, `Route parameter '${parameter}' is missing`)

      properties[property] = value

      return properties
    }, {})
  }
}
