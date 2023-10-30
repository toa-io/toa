import { decode } from 'msgpackr'
import { type ProviderClass, providers } from './providers'
import { Storage, type Storages } from './Storage'
import { Aspect } from './Aspect'

export class Factory {
  private readonly declaration: Record<string, string>

  public constructor () {
    const env = process.env.TOA_STORAGES

    if (env === undefined)
      throw new Error('TOA_STORAGES is not defined')

    this.declaration = decode(Buffer.from(env, 'base64')) as Record<string, string>
  }

  public aspect (): Aspect {
    const storages = this.createStorages()

    return new Aspect(storages)
  }

  public createStorage (name: string, ref: string): Storage {
    const url = new URL(ref)
    const Provider = providers[url.protocol]

    if (Provider === undefined)
      throw new Error(`No provider found for '${url.protocol}'`)

    const secrets = this.resolveSecrets(name, Provider)

    const provider = new Provider(url, secrets)

    return new Storage(provider)
  }

  private createStorages (): Storages {
    const storages: Storages = {}

    for (const [name, ref] of Object.entries(this.declaration))
      storages[name] = this.createStorage(name, ref)

    return storages
  }

  private resolveSecrets (name: string, Class: ProviderClass): Record<string, string> {
    if (Class.SECRETS === undefined)
      return {}

    const secrets: Record<string, string> = {}

    for (const secret of Class.SECRETS) {
      const variable = `TOA_STORAGES_${name.toUpperCase()}_${secret.toUpperCase()}`
      const value = process.env[variable]

      if (value === undefined)
        throw new Error(`${variable} is not defined`)

      secrets[secret] = value
    }

    return secrets
  }
}
