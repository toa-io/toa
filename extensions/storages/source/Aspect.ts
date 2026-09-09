import { Connector } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import { type Storage, type Storages } from './Storage.js'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'storages'

  private readonly create: () => Promise<Storages>
  private storages: Storages = {}

  /** The storages are made as the aspect connects: their providers load then, not before. */
  public constructor(create: () => Promise<Storages>) {
    super()

    this.create = create
  }

  protected override async open(): Promise<void> {
    this.storages = await this.create()
  }

  public invoke(name: string, method: keyof Storage, ...args: unknown[]): unknown {
    const storage = this.storages[name]

    if (storage === undefined) throw new Error(`Storage '${name}' is not defined`)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return storage[method](...args)
  }
}
