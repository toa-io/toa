import assert from 'node:assert'
import type { Directive } from './Directive.js'
import type * as http from '../../HTTP/index.js'

/**
 * The status of the reply, taken from a property of what the operation returned and removed
 * from it — an outcome the operation knows and the transport does not, like a protocol that
 * states its error as a body rather than as a status of its own.
 *
 * Settled rather than transformed, so the status is set before anything reads it. A reply of
 * 300 or above is left as the operation built it, which `io:output` does not restrict: a
 * failure and a success are different shapes, and one list of permitted properties does not
 * describe both.
 */
export class Status implements Directive {
  private readonly property: string

  public constructor (property: unknown) {
    this.property = property as string
  }

  public static validate (value: unknown): asserts value is string {
    assert.ok(typeof value === 'string', '`io:status` must be a string')
  }

  public preflight (): void {
    // nothing to do until the operation has answered
  }

  public settle (_: unknown, response: http.OutgoingMessage): void {
    const body: unknown = response.body

    if (body === null || typeof body !== 'object' || !(this.property in body))
      return

    const value: unknown = (body as Record<string, unknown>)[this.property]

    assert.ok(typeof value === 'number',
      `\`io:status\` expects '${this.property}' to be a number`)

    response.status = value

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (body as Record<string, unknown>)[this.property]
  }
}
