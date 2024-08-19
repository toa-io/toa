import { Stream } from 'node:stream'
import { console } from 'openspan'
import * as schemas from './schemas'
import type { Message } from './Message'
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
    schemas.output.validate(permissions, 'Incorrect \'io:output\' format')
  }

  public attach (context: Context): void {
    context.pipelines.response.push(this.restriction(context))
  }

  private restriction (context: Context) {
    return (message: OutgoingMessage): void => {
      const error = message.status !== undefined && message.status >= 300
      const stream = message.body instanceof Stream
      const none = message.body === undefined || message.body === null

      if (this.disabled || error || stream || none)
        return

      if (typeof message.body !== 'object' || this.permissions.length === 0) {
        if (this.omitted)
          console.warn('Permissions for \'io:output\' are not specified properly, response omitted',
            { path: context.url.pathname })

        delete message.body

        return
      }

      schemas.message.validate<Message>(message.body,
        '\'io:output\' expects response to be an object or array of objects')

      if (Array.isArray(message.body))
        message.body = message.body.map((entity) => this.fit(entity as Message))
      else
        message.body = this.fit(message.body)
    }
  }

  private fit (message: Message): Message | undefined {
    const entries = Object.entries(message)
      .filter(([key]) => this.permissions.includes(key))

    return Object.fromEntries(entries)
  }
}

export type Permissions = string[] | boolean
