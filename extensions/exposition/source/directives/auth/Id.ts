import { type Parameter } from '../../RTD/index.js'
import { type Directive, type Identity } from './types.js'
import type { Introspection } from '../../Introspection.js'

export class Id implements Directive {
  private readonly parameter: string

  public constructor(parameter: string) {
    this.parameter = parameter
  }

  /**
   * Whether it is *this* identity's cannot be told from a description, which has no route
   * variable to read — but that there must be an identity at all can, and a caller with
   * none is refused whatever the value would have been.
   */
  public admits(identity: Identity | null): boolean | undefined {
    return identity === null ? false : undefined
  }

  /** Reaching it is being the identity it is about, which is what `private` says. */
  public describe(introspection: Introspection): Introspection {
    return { ...introspection, private: true }
  }

  public authorize(
    identity: Identity | null,
    _: unknown,
    parameters: Parameter[]
  ): boolean {
    if (identity === null) return false

    const parameter = parameters.find((parameter) => parameter.name === this.parameter)

    return parameter?.value === identity.id
  }
}
