import { Connector, type extensions } from '@toa.io/core'
import { type Storage, type Storages } from './Storage'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'storages'

  private readonly storages: Storages

  public constructor (storages: Storages) {
    super()

    this.storages = storages
  }

  public invoke (name: string, method: keyof Storage, ...args: any[]): any {
    if (!(name in this.storages))
      throw new Error(`Storage '${name}' is not defined`)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.storages[name][method](...args)
  }
}
