import { decode } from 'msgpackr'
import { providers } from './providers'
import { Storage, type Storages } from './Storage'
import { Aspect } from './Aspect'

export class Factory {
  public aspect (): Aspect {
    const storages = this.createStorages()

    return new Aspect(storages)
  }

  public createStorage (ref: string): Storage {
    const url = new URL(ref)
    const Provider = providers[url.protocol]

    if (Provider === undefined)
      throw new Error(`No provider found for '${url.protocol}'`)

    const provider = new Provider(url)

    return new Storage(provider)
  }

  private createStorages (): Storages {
    const env = process.env.TOA_STORAGES

    if (env === undefined)
      throw new Error('TOA_STORAGES is not defined')

    const declaration = decode(Buffer.from(env, 'hex')) as Record<string, string>
    const storages: Storages = {}

    for (const [name, ref] of Object.entries(declaration))
      storages[name] = this.createStorage(ref)

    return storages
  }
}
