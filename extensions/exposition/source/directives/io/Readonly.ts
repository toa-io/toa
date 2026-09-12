import type { Directive } from './Directive.ts'
import type { Input as Context } from '../../io.ts'

/**
 * Whether the call this method makes may only read, which is what `GET` and `HEAD` are taken to
 * mean. `false` lets a safe method reach an operation that changes state — a `GET` that opens a
 * stream — and `true` holds any other method to reading.
 */
export class Readonly implements Directive {
  /** what the route declared, which is what describes the method as well as what it does */
  public readonly value: boolean

  public constructor(value: unknown) {
    this.value = value as boolean
  }

  public static validate(value: unknown): asserts value is boolean {
    if (typeof value !== 'boolean') throw new Error('`io:readonly` must be a boolean')
  }

  public precall(context: Context): void {
    context.readonly = this.value
  }
}
