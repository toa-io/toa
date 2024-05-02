import { Connector } from '@toa.io/core'
import type { Origin } from './Origin'
import type { PublishOptions, PubSub } from '@google-cloud/pubsub'

export class Topic extends Connector {
  private readonly publisher

  public constructor (pubsub: PubSub, origin: Origin) {
    super()

    const name = `projects/${origin.project}/topics/${origin.topic}`

    this.publisher = pubsub.topic(name, OPTIONS)
  }

  public async publish (payload: unknown): Promise<string> {
    const data = Buffer.from(JSON.stringify(payload))

    return this.publisher.publishMessage({ data })
  }
}

const OPTIONS: PublishOptions = { batching: { maxMessages: 100, maxMilliseconds: 1000 } }
