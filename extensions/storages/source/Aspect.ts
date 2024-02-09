import assert from 'node:assert'
import { Connector, type extensions } from '@toa.io/core'
import { type Storage, type Storages } from './Storage'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'storages'

  private readonly storages: Storages

  public constructor (storages: Storages) {
    super()

    this.storages = storages
  }

  public invoke (name: string, method: keyof Storage, ...args: unknown[]): unknown {
    const storage = this.storages[name]

    assert.ok(storage !== undefined, `Storage '${name}' is not defined`)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return storage[method](...args)
  }
}
