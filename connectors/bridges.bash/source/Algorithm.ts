import util from 'node:util'
import process from 'node:child_process'
import { Connector } from '@toa.io/core'
import type { bridges, Reply } from '@toa.io/core'

const exec = util.promisify(process.exec)

export class Algorithm extends Connector implements bridges.Algorithm {
  private readonly path: string

  public constructor (path: string) {
    super()
    this.path = path
  }

  public async mount (): Promise<void> {

  }

  public async execute (input: object): Promise<Reply> {
    const args = Object.entries(input).map(([key, value]) => `--${key} ${value}`).join(' ')
    const command = `${this.path}${args === '' ? '' : ` ${args}`}`

    try {
      const result = await exec(command)

      return { output: result.stdout.trim() }
    } catch (error: any) {
      const message: string | undefined = error.stderr?.trim()

      return { output: new Error(message) }
    }
  }
}
