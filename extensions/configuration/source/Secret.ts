import { inspect } from 'node:util'
import type { Secret as Contract } from '@toa.io/types'

/** A configuration value that must not leak: a string only to whoever asks for it. */
export class Secret implements Contract {
  readonly #value: string

  public constructor (value: string) {
    this.#value = value
  }

  public unwrap (): string {
    return this.#value
  }

  public toString (): string {
    return REDACTED
  }

  public toJSON (): string {
    return REDACTED
  }

  public [inspect.custom] (): string {
    return REDACTED
  }
}

export const REDACTED = '<REDACTED>'
