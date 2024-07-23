import assert from 'node:assert'
import { console } from 'openspan'
import { decode } from '@toa.io/generic'
import { providers } from './providers'
import { Storage, type Storages } from './Storage'
import { Aspect } from './Aspect'
import { ENV_PREFIX } from './deployment'
import { validateAnnotation } from './Annotation'
import type { Declaration } from './providers'
import type { Annotation } from './Annotation'
import type { ProviderConstructor, ProviderSecrets } from './Provider'

export class Factory {
  private readonly annotation: Annotation

  public constructor () {
    const env = process.env[ENV_PREFIX]

    assert.ok(env !== undefined, `${ENV_PREFIX} is not defined`)

    this.annotation = decode(env)

    validateAnnotation(this.annotation)
  }

  public aspect (): Aspect {
    const storages = this.createStorages()

    return new Aspect(storages)
  }

  private createStorages (): Storages {
    const storages: Storages = {}

    for (const [name, declaration] of Object.entries(this.annotation))
      storages[name] = this.createStorage(name, declaration)

    return storages
  }

  private createStorage (name: string, declaration: Declaration): Storage {
    const { provider: providerId, ...options } = declaration
    const Provider: ProviderConstructor = providers[providerId]
    const secrets = this.resolveSecrets(name, Provider)
    const provider = new Provider(options, secrets)

    console.debug('Storage created', { name, provider: providerId, options, path: provider.path })

    return new Storage(provider)
  }

  private resolveSecrets (storageName: string,
    Class: ProviderConstructor): ProviderSecrets {
    if (Class.SECRETS === undefined)
      return {}

    const secrets: Record<string, string | undefined> = {}

    for (const secret of Class.SECRETS) {
      const variable = `${ENV_PREFIX}_${storageName}_${secret.name}`.toUpperCase()
      const value = process.env[variable]

      assert.ok(secret.optional === true || value !== undefined,
        `'${variable}' is not defined`)

      secrets[secret.name] = value
    }

    return secrets
  }
}
