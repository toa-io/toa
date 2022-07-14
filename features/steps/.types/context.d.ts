import type { Connector } from '@toa.io/core/types'

declare namespace toa.features {

    type Context = {
        cwd?: string
        stdout?: string
        stderr?: string
        stdoutLines?: string[]
        stderrLines?: string[]
        aborted?: boolean
        connector: Connector
    }

}
