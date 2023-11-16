import * as amqp from 'amqplib'

import type { Connector, Reply, Exception } from '@toa.io/core/types'
import type { Migration } from '@toa.io/core/types/storages'
import type { StartedTestContainer } from 'testcontainers'

declare namespace toa.features{

  namespace context{

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
    exception?: Exception
    env?: string[]
    containers?: Record<string, StartedTestContainer>
    failureAwait?: boolean
  }

}
