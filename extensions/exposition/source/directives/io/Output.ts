import { Stream } from 'node:stream'
import { console } from 'openspan'
import * as schemas from './schemas.js'
import type { Message } from './Message.js'
import type { Directive } from './Directive.js'
import type { Input as Context } from '../../io.js'
import type { OutgoingMessage } from '../../HTTP/index.js'

export class Output implements Directive {
  /** whether the reply passes whole, which is when the schema is the operation's own */
  public readonly disabled: boolean = false

  /** what a reply may carry, which is therefore what the output schema states */
  public readonly allowed: Set<string>
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

    this.allowed = new Set(this.permissions)
  }

  public static validate (permissions: unknown): asserts permissions is Permissions {
    schemas.output.validate(permissions, 'Incorrect \'io:output\' format')
  }

  public precall (context: Context): void {
    context.pipelines.response.push(this.restriction(context))
  }

  private restriction (context: Context) {
    return (message: OutgoingMessage): void => {
      // what the gateway built is its own — a code and a message — and a restriction has
      // nothing to say about it; everything else is a reply the operation returned, and is
      // restricted whatever status it carries
      const error = message.authentic === true
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

  /** Runs per entity of a collection, hence the set and the absence of intermediates. */
  private fit (message: Message): Message {
    const output: Message = {}

    // the keys of the entity, so that the response keeps the order it was built in
    for (const key of Object.keys(message))
      if (this.allowed.has(key))
        output[key] = message[key]

    return output
  }
}

export type Permissions = string[] | boolean
