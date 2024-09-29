import assert from 'node:assert'
import { Property } from './Properties'

export class Languages extends Property<'languages'> {
  public constructor (value: string[]) {
    assert.ok(Array.isArray(value) && value.length > 0, '`map:languages` must be a non-empty array of strings')
    assert.ok(value.every((language) => typeof language === 'string'), '`map:languages` must be an array of strings')

    super('languages', value)
  }
}
