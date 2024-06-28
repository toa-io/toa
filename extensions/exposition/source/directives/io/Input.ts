import { BadRequest } from '../../HTTP'
import * as schemas from './schemas'
import type { Message } from './Message'
import type { Directive } from './Directive'
import type { Input as Context } from '../../io'

export class Input implements Directive {
  private readonly permissions: Permissions

  public constructor (permissions: Permissions) {
    this.permissions = permissions
  }

  public static validate (permissions: unknown): asserts permissions is Permissions {
    schemas.input.validate(permissions, 'Incorrect \'io:input\' format')
  }

  public attach (context: Context): void {
    context.pipelines.body.push((body) => this.check(body))
  }

  private check (body: unknown): unknown {
    try {
      schemas.message.validate(body)
    } catch {
      throw new BadRequest('Invalid request body')
    }

    const property = this.violation(body)

    if (property !== undefined)
      throw new BadRequest(`Unexpected input: ${property}`)

    return body
  }

  private violation (value: Message | Message[]): string | undefined {
    if (!Array.isArray(value))
      return Object.keys(value).find((key) => !this.permissions.includes(key))

    for (const item of value) {
      const property = this.violation(item)

      if (property !== undefined)
        return property
    }
  }
}

export type Permissions = string[]
