import { Connector } from '@toa.io/core'
import { console } from 'openspan'
import type { Console, Task } from 'openspan'
import type { Locator, extensions } from '@toa.io/core'

export class Span extends Connector implements extensions.Aspect {
  public readonly name = 'span'
  private readonly locator: Locator
  private readonly consoles: Record<string, Console> = {}

  public constructor (locator: Locator) {
    super()

    this.locator = locator
  }

  // eslint-disable-next-line max-params
  public async invoke (operation: string, name: string, attributes: object | Task<unknown>, task?: Task<unknown>): Promise<unknown> {
    this.consoles[operation] ??= console.fork({
      namespace: this.locator.namespace,
      component: this.locator.name,
      operation
    })

    const output = this.consoles[operation]

    if (typeof attributes === 'function')
      return await output.span(name, attributes as Task<unknown>)
    else
      return await output.span(name, attributes, task!)
  }
}
