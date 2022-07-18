import * as amqp from 'amqplib'

import type { Connector } from '@toa.io/core/types'
import type { Migration } from '@toa.io/core/types/storages'

declare namespace toa.features {

  namespace context {

    type Storage = {
      driver: string
      database?: string
      table?: string
      migration?: Migration
    }

    type AMQP = {
      connection?: amqp.Connection
      channel?: amqp.Channel
    }

  }

  type Context = {
    cwd?: string
    stdout?: string
    stderr?: string
    stdoutLines?: string[]
    stderrLines?: string[]
    aborted?: boolean
    connector?: Connector
    storage?: context.Storage
    amqp?: context.AMQP
  }

}
