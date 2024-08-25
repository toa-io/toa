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

  public invoke (operation: string, fork: 'fork', context: object): Console
  // eslint-disable-next-line max-params
  public invoke (operation: string, severity: Channel | 'fork', message: string | object, attributes?: object): Console | undefined {
    if (!(operation in this.consoles))
      this.consoles[operation] = this.console.fork({
        namespace: this.locator.namespace,
        component: this.locator.name,
        operation
      })

    if (severity === 'fork')
      return this.consoles[operation].fork(message as Record<string, unknown>)
    else
      this.consoles[operation][severity](message as string, attributes as Record<string, unknown>)
  }
}

export type LogsOptions = Pick<ConsoleOptions, 'level'>
