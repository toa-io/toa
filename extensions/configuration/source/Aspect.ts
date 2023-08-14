import { Connector, type extensions } from '@toa.io/core'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'configuration'

  private readonly value: object

  public constructor (value: object) {
    super()

    this.value = value
  }

  public invoke (path: string[]): any {
    let cursor: any = this.value

    if (path !== undefined)
      for (const segment of path)
        cursor = cursor[segment]

    return cursor
  }
}
