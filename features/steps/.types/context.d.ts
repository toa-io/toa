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

    /** Settles once the program has exited, or has run and fallen quiet. */
    settled?: Promise<void>

    /** The directory the scenario created, removed once it ends; `cwd` may point elsewhere. */
    workspace?: string
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
