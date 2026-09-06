import * as amqp from 'amqplib'

import type { Connector, Exception } from '@toa.io/core'
import type { Reply } from '@toa.io/core/types'
import type { StartedTestContainer } from 'testcontainers'

declare namespace toa.features {
  namespace context {
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
    amqp?: context.AMQP
    reply?: Reply
    pendingReply?: Promise<Reply>
    exception?: Exception
    env?: Array<[string, string | undefined]>
    containers?: Record<string, StartedTestContainer>
  }
}
