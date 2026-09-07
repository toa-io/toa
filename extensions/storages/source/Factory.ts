import assert from 'node:assert'
import { console } from 'openspan'
import { providers } from './providers/index.js'
import { Storage, type Storages } from './Storage.js'
import { Aspect } from './Aspect.js'
import { ENV_PREFIX, validateAnnotation } from '@toa.io/definitions/extensions.storages'
import { environment } from '@toa.io/generic'
import type { Constructor } from './Provider.js'
import type { Declaration } from './providers/index.js'
import type { Secrets } from './Secrets.js'
import type { Annotation } from '@toa.io/definitions/extensions.storages'

export class Factory {
  private readonly annotation: Annotation

  public constructor() {
    const env = environment.get(ENV_PREFIX)

    assert.ok(env !== undefined, `${ENV_PREFIX} is not defined`)

    this.annotation = JSON.parse(env)

    validateAnnotation(this.annotation)
  }

  public aspect(): Aspect {
    return new Aspect(() => this.createStorages())
  }

  private async createStorages(): Promise<Storages> {
    const storages: Storages = {}

    for (const [name, declaration] of Object.entries(this.annotation))
      // the annotation is validated above, so a declaration is its provider's
      storages[name] = await this.createStorage(name, declaration as Declaration)

    return storages
  }

  private async createStorage(name: string, declaration: Declaration): Promise<Storage> {
    const { provider: id, ...options } = declaration
    const Provider: Constructor = await providers[id]()
    const secrets = this.resolveSecrets(name, Provider)
    const provider = new Provider(options, secrets)

    console.debug('Storage created', {
      name,
      provider: id,
      ...(provider.root === undefined ? undefined : { root: provider.root })
    })

    return new Storage(provider, { name, provider: id })
  }

  private resolveSecrets(storageName: string, Class: Constructor): Secrets {
    if (Class.SECRETS === undefined) return {}

    const secrets: Record<string, string | undefined> = {}

    for (const secret of Class.SECRETS) {
      const variable = `${ENV_PREFIX}_${storageName}_${secret.name}`.toUpperCase()
      const value = environment.get(variable)

      assert.ok(
        secret.optional === true || value !== undefined,
        `'${variable}' is not defined`
      )

      secrets[secret.name] = value
    }

    return secrets
  }
}
