import type { Connector } from '@toa.io/core/types'
import type { Migration } from '@toa.io/core/types/storages'

declare namespace toa.features {

  type Context = {
    cwd?: string
    stdout?: string
    stderr?: string
    stdoutLines?: string[]
    stderrLines?: string[]
    aborted?: boolean
    connector?: Connector
    database?: string
    migration?: Migration
  }

}
