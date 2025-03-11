import * as assert from 'node:assert'
import { Connector, type Remote, type extensions, Locator } from '@toa.io/core'
import type { Bootloader } from './Factory'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'mail'

  private readonly boot: Bootloader
  private remote!: Remote

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  public async invoke (operation: string, args: Input): Promise<unknown> {
    assert.ok(operation === 'send', `Unknown mail extension operation '${operation}'`)

    const { sync, ...input } = args

    return await this.remote.invoke(operation, { input, task: sync !== true })
  }

  protected override async open (): Promise<void> {
    const locator = new Locator('agent', 'mail')

    this.remote = await this.boot.remote(locator)
    this.depends(this.remote)

    await this.remote.connect()
  }
}

type Input = { sync?: boolean } & toa.extensions.mail.Message
