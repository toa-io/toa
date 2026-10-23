import { current, encode } from 'openspan'
import { Connector, entities, exceptions } from '@toa.io/core'
import type { Channel } from './Channel.ts'
import type { Message } from './Message.ts'
import type { Locator } from '@toa.io/core'
import type { bindings } from '@toa.io/core/types'

/**
 * `context.chronicles.send(name, payload)` — a fact that changes no state, written to the log
 * under `<component>.<name>`. It goes straight to the broker and resolves once the broker has
 * confirmed it; nothing retries it.
 */
export class Sender extends Connector {
  public readonly name = 'chronicles'

  private readonly locator: Locator
  private readonly channel: Channel
  private outbound!: bindings.Outbound

  public constructor(locator: Locator, channel: Channel) {
    super()

    this.locator = locator
    this.channel = channel
  }

  // named rather than forwarded, so that the connector's lifecycle is not reachable from an
  // algorithm
  public async invoke(method: string, ...args: any[]): Promise<void> {
    if (method !== 'send')
      throw new exceptions.MisuseException(`Chronicles have no '${method}'`)

    await this.send(args[0], args[1])
  }

  protected override async open(): Promise<void> {
    this.outbound = await this.channel.open()

    this.depends(this.outbound)
  }

  private async send(name: unknown, payload: unknown): Promise<void> {
    if (typeof name !== 'string' || !NAME.test(name))
      throw new exceptions.MisuseException(
        `A chronicle is named by segments of letters and digits separated by dots, not '${String(name)}'`
      )

    if (payload !== undefined && (typeof payload !== 'object' || Array.isArray(payload)))
      throw new exceptions.MisuseException('The payload of a chronicle is an object')

    const context = current()

    const message: Message = {
      id: entities.newid(),
      label: `${this.locator.id}.${name}`,
      component: this.locator.id,
      time: Date.now(),
      entity: null,
      version: null,
      trace: context === undefined ? null : encode(context),
      payload: payload ?? null
    }

    await this.channel.send(this.outbound, message)
  }
}

const NAME = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/
