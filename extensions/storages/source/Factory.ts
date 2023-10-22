import { Storage } from './Storage'
import { providers } from './providers'

export class Factory {
  public createStorage (ref: string): Storage {
    const url = new URL(ref)
    const Provider = providers[url.protocol]

    if (Provider === undefined)
      throw new Error(`No provider found for '${url.protocol}'`)

    const provider = new Provider(url)

    return new Storage(provider)
  }
}
