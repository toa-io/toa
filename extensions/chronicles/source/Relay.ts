import { Connector, exceptions } from '@toa.io/core'
import type { Encounter, Row } from './Provider.ts'
import type { Publisher } from './Publisher.ts'

/**
 * What `chronicles.relay` publishes the tasks it is given through: a fact a component sent, and the
 * encounters of a batch a client sent. A task is done once the broker has confirmed its rows. The
 * publisher is the relay's own, closed with it: the component may be composed by another factory
 * than the one of the service it runs in.
 */
export class Relay extends Connector {
  public readonly name = 'chronicles'

  private readonly publisher: Publisher

  public constructor(publisher: Publisher) {
    super()

    this.publisher = publisher
    this.depends(publisher)
  }

  public async invoke(method: string, ...args: any[]): Promise<void> {
    switch (method) {
      case 'record':
        return await this.publisher.publish([args[0] as Row])
      case 'encounter':
        return await this.publisher.publish([], [], args[0] as Encounter[])
      default:
        throw new exceptions.MisuseException(`Chronicles have no '${method}'`)
    }
  }
}
