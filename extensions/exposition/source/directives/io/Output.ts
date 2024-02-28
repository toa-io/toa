import assert from 'node:assert'
import type { Directive } from './Directive'
import type { Input as Context } from '../../io'
import type { OutgoingMessage } from '../../HTTP'

export class Output implements Directive {
  private readonly disabled: boolean = false
  private readonly omitted: boolean = true
  private readonly permissions: string[] = []

  public constructor (permissions: Permissions) {
    if (typeof permissions === 'boolean')
      if (permissions)
        this.disabled = true
      else
        this.omitted = false

    else
      this.permissions = permissions
  }

  public static validate (permissions: unknown): asserts permissions is Permissions {
    assert.ok(typeof permissions === 'boolean' || Array.isArray(permissions),
      'Incorrect \'io:output\' format: an array of property names or a boolean value is expected.')
  }

  public attach (context: Context): void {
    context.pipelines.response.push(this.restrict(context))
  }

  private restrict (context: Context) {
    return (message: OutgoingMessage) => {
      if (this.disabled || message.body === undefined || message.body === null)
        return

      const acceptable = Object.getPrototypeOf(message.body) === PROTO ||
        (Array.isArray(message.body) &&
          message.body.every((entity) => Object.getPrototypeOf(entity) === PROTO))

      if (!acceptable || this.permissions.length === 0) {
        if (this.omitted)
          console.warn(`Permissions for 'io:output' are not specified (${context.request.url}). ` +
            'Response omitted.')

        delete message.body

        return
      }

      if (Array.isArray(message.body))
        message.body = message.body.map((entity) => this.fit(entity as Entity))
      else
        message.body = this.fit(message.body as Entity)
    }
  }

  private fit (entity: Entity): Entity {
    const entries = Object.entries(entity)
      .filter(([key]) => this.permissions.includes(key))

    return Object.fromEntries(entries)
  }
}

const PROTO = Object.getPrototypeOf({})

type Entity = Record<string, unknown>

export type Permissions = string[] | boolean
