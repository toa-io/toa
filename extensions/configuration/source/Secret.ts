import { inspect } from 'node:util'

/**
 * A configuration value that must not leak: a string only to whoever asks for it.
 *
 * This is what a value declared `format: secret` is on a component's context.
 */
export class Secret {
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
