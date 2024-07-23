import { Connector } from '@toa.io/core'
import { console } from 'openspan'
import type { Channel, Console, ConsoleOptions } from 'openspan'
import type { Locator, extensions } from '@toa.io/core'

export class Logs extends Connector implements extensions.Aspect {
  public readonly name = 'logs'
  private readonly locator: Locator
  private readonly console: Console
  private readonly consoles: Record<string, Console> = {}

  public constructor (locator: Locator, options: LogsOptions) {
    super()

    this.locator = locator
    this.console = console.fork()
    this.console.configure(options)
  }

  // eslint-disable-next-line max-params
  public invoke (operation: string, severity: Channel, message: string, attributes?: object): void {
    if (!(operation in this.consoles))
      this.consoles[operation] = this.console.fork({
        endpoint: `${this.locator.id}.${operation}`
      })

    this.consoles[operation][severity](message, attributes)
  }
}

export type LogsOptions = Pick<ConsoleOptions, 'level'>
