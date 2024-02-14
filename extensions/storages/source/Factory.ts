import assert from 'node:assert'
import { decode } from '@toa.io/generic'
import { providers } from './providers'
import { Storage, type Storages } from './Storage'
import { Aspect } from './Aspect'
import { validateProviderId, SERIALIZATION_PREFIX } from './deployment'
import type { ProviderConstructor } from './Provider'

export class Factory {
  private readonly declaration: Record<string, Record<string, unknown>>

  public constructor () {
    const env = process.env.TOA_STORAGES

    if (env === undefined) throw new Error('TOA_STORAGES is not defined')

    this.declaration = decode(env)
  }

  public aspect (): Aspect {
    const storages = this.createStorages()

    return new Aspect(storages)
  }

  public createStorage (componentName: string, { provider: providerId, ...props }: any): Storage {
    validateProviderId(providerId)

    const Provider = providers[providerId]

    const secrets = this.resolveSecrets(componentName, Provider)

    const provider = new Provider({ ...props, secrets })

    return new Storage(provider)
  }

  private createStorages (): Storages {
    const storages: Storages = {}

    for (const [componentName, props] of Object.entries(this.declaration))
      storages[componentName] = this.createStorage(componentName, props)

    return storages
  }

  private resolveSecrets (componentName: string,
    Class: ProviderConstructor): Record<string, string | undefined> {
    if (Class.SECRETS === undefined) return {}

    const secrets: Record<string, string | undefined> = {}

    for (const secret of Class.SECRETS) {
      const variable = `${SERIALIZATION_PREFIX}_${componentName}_${secret.name}`.toUpperCase()
      const value = process.env[variable]

      assert.ok(secret.optional === true || value !== undefined,
        `'${variable}' is not defined`)

      secrets[secret.name] = value
    }

    return secrets
  }
}
