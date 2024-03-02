import { spawnSync } from 'node:child_process'
import { userInfo } from 'node:os'
import { Connector } from '@toa.io/core'
import type { bridges, Reply } from '@toa.io/core'

export class Algorithm extends Connector implements bridges.Algorithm {
  private readonly shell: string
  private readonly path: string

  public constructor (path: string) {
    super()

    const shell = userInfo().shell

    if (shell === null)
      throw new Error('The shell is not available. Am I running on Windows?')

    this.shell = shell
    this.path = path
  }

  public async mount (): Promise<void> {
  }

  public async execute (input: Record<string, unknown> | undefined | null): Promise<Reply> {
    const args = (input === undefined || input === null)
      ? []
      : Object.entries(input).map(([key, value]) => ['--' + key, value?.toString() ?? '']).flat()

    const result = spawnSync(this.shell, [this.path].concat(args), { shell: true })

    if (result.status === 0) {
      const output = result.stdout.toString().trim()

      return { output }
    } else {
      const error = new Error(result.stderr.toString().trim())

      if (result.status === 1)
        return { output: error }
      else
        throw error
    }
  }
}
