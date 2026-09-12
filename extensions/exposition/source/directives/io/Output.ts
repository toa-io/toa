import * as schemas from './schemas.ts'
import type { Directive } from './Directive.ts'
import type { Input as Context } from '../../io.ts'

export class Output implements Directive {
  /** whether the reply passes whole, which is when the schema is the operation's own */
  public readonly disabled: boolean = false

  /** what a reply may carry, which is therefore what the output schema states */
  public readonly allowed: Set<string>
  private readonly omitted: boolean = true
  private readonly permissions: string[] = []

  public constructor(permissions: Permissions) {
    if (typeof permissions === 'boolean')
      if (permissions) this.disabled = true
      else this.omitted = false
    else this.permissions = permissions

    this.allowed = new Set(this.permissions)
  }

  public static validate(permissions: unknown): asserts permissions is Permissions {
    schemas.output.validate(permissions, "Incorrect 'io:output' format")
  }

  /**
   * What the request asks for of the output, which the operation answers of it. A route that
   * passes the reply whole asks for nothing, and one declaring these beside an inherited list
   * asks for what the two have in common.
   */
  public precall(context: Context): void {
    if (this.disabled) return

    context.output =
      context.output === undefined
        ? this.permissions
        : context.output.filter((property) => this.allowed.has(property))
  }
}

export type Permissions = string[] | boolean
