import { BadRequest } from '../../HTTP'
import * as schemas from './schemas'
import type { Message } from './Message'
import type { Directive } from './Directive'
import type { Input as Context } from '../../io'

export class Input implements Directive {
  private readonly allowed: Set<string>

  public constructor (permissions: Permissions) {
    this.allowed = new Set(permissions)
  }

  public static validate (permissions: unknown): asserts permissions is Permissions {
    schemas.input.validate<Permissions>(permissions, 'Incorrect \'io:input\' format')
  }

  public preflight (context: Context): void {
    // Restrictions are on what the client sent, so the check goes to the front of the
    // pipeline whatever order the families ran in: `auth:delegate` embeds the identity
    // and `map:*` assigns mapped properties, and those additions are the server's own,
    // not input to be restricted.
    context.pipelines.body.unshift((body) => this.check(body))
  }

  private check (body: unknown): Message | Message[] | undefined {
    if (body === undefined)
      return body

    try {
      schemas.message.validate<Message | Message[]>(body)
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
      return Object.keys(value).find((key) => !this.allowed.has(key))

    for (const item of value) {
      const property = this.violation(item)

      if (property !== undefined)
        return property
    }
  }
}

export type Permissions = string[]
