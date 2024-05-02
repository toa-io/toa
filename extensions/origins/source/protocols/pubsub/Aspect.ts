import assert from 'node:assert'
import { Connector } from '@toa.io/core'
import { PubSub } from '@google-cloud/pubsub'
import { Topic } from './Topic'
import type { Origin } from './Origin'
import type { extensions } from '@toa.io/core'
import type { Declaration } from '../../Factory'

class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'pubsub'

  private readonly topics: Record<string, Topic>

  public constructor (topics: Record<string, Topic>) {
    super()

    this.topics = topics

    const values = Object.values(topics)

    if (values.length > 0)
      this.depends(values)
  }

  public async invoke (method: Method, topic: string, message: unknown): Promise<string> {
    assert(topic in this.topics, `Pub/Sub topic ${topic} is not defined`)

    return await this.topics[topic][method](message)
  }
}

type Method = 'publish'

export function create (declaration: Declaration): Aspect {
  const origins = toOrigins(declaration)
  const topics = toTopics(origins)

  return new Aspect(topics)
}

function toOrigins (declaration: Declaration): Record<string, Origin> {
  const origins: Record<string, Origin> = {}

  for (const [name, references] of Object.entries(declaration.origins))
    origins[name] = toOrigin(references[0])

  return origins
}

function toOrigin (reference: string): Origin {
  const url = new URL(reference)
  const [, , project, , topic] = url.pathname.split('/')
  const json = process.env['TOA_ORIGINS_PUBSUB_' + project]
  const credentials = json !== undefined ? JSON.parse(json) : undefined

  return {
    endpoint: url.host,
    credentials,
    project,
    topic
  }
}

function toTopics (origins: Record<string, Origin>): Record<string, Topic> {
  const pubsub: Record<string, PubSub> = {}
  const topics: Record<string, Topic> = {}

  for (const [name, origin] of Object.entries(origins)) {
    if (!(origin.project in pubsub))
      pubsub[origin.project] = new PubSub({
        projectId: origin.project,
        apiEndpoint: origin.endpoint,
        credentials: origin.credentials
      })

    topics[name] = new Topic(pubsub[origin.project], origin)
  }

  return topics
}
