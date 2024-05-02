import * as amqp from 'amqplib'

import type { Connector, Reply, Exception } from '@toa.io/core'
import type { Migration } from '@toa.io/core/types/storages'
import type { StartedTestContainer } from 'testcontainers'
import type { Subscription } from '@google-cloud/pubsub'

declare namespace toa.features {

  namespace context {

    type Storage = {
      driver: string
      database?: string
      tables?: Record<string, string>
      migration?: Migration
    }

    type AMQP = {
      connection?: amqp.Connection
      channel?: amqp.Channel
    }

    type PubSubTopic = {
      subscription: Subscription
      messages: unknown[]
    }
  }

  type Context = {
    process?: Promise<any>
    cwd?: string
    exitCode?: number
    stdout?: string
    stderr?: string
    stdoutLines?: string[]
    stderrLines?: string[]
    aborted?: boolean
    connector?: Connector
    storage?: context.Storage
    amqp?: context.AMQP
    reply?: Reply
    pendingReply?: Promise<Reply>
    exception?: Exception
    env?: string[]
    containers?: Record<string, StartedTestContainer>
    pubsub: Record<string, context.PubSubTopic>
  }

}
