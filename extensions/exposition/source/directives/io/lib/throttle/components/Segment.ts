import assert from 'node:assert'
import type { Parameter } from '../../../../../RTD'
import type { Input as Context } from '../../../../../io'
import type { Component } from './Component'

/** The value a named route segment was bound to, or nothing when the route has none. */
export class Segment implements Component {
  private readonly name: string

  public constructor (name: unknown) {
    assert.ok(typeof name === 'string', 'Throttle segment must be a string')

    this.name = name
  }

  public get (_: Context, parameters: Parameter[]): string {
    return parameters.find(({ name }) => name === this.name)?.value ?? ''
  }
}
