import { console } from 'openspan'
import { provider as load } from './providers/index.ts'
import { Storage, type Storages } from './Storage.ts'
import { Aspect } from './Aspect.ts'
import { ENV_PREFIX, validateAnnotation } from '@toa.io/definitions/extensions.storages'
import { environment } from '@toa.io/generic'
import type { Constructor } from './Provider.ts'
import type { Declaration } from './providers/index.ts'
import type { Secrets } from './Secrets.ts'
import type { Annotation } from '@toa.io/definitions/extensions.storages'

export class Factory {
  private readonly annotation: Annotation

  /** The storages made so far, by name: one for the process, whichever component declares it. */
  private readonly made = new Map<string, Promise<Storage>>()

  public constructor() {
    const env = environment.get(ENV_PREFIX)

    if (env === undefined) throw new Error(`${ENV_PREFIX} is not defined`)

    this.annotation = JSON.parse(env)

    validateAnnotation(this.annotation)
  }

  /**
   * The storages of a component: those it declares, and every storage there is where it names
   * none (`storages: ~`). A deploy installs the SDKs of the providers a composition's components
   * declare and no other, so a storage nobody in the process declares is not made: its provider
   * may not be there.
   */
  public aspect(_: unknown, declaration?: string[] | null): Aspect {
    const names =
      declaration === undefined || declaration === null || declaration.length === 0
        ? Object.keys(this.annotation)
        : declaration

    return new Aspect(() => this.createStorages(names))
  }

  private async createStorages(names: string[]): Promise<Storages> {
    const storages: Storages = {}

    for (const name of names) {
      const declaration = this.annotation[name]

      // one the annotation does not declare is refused as it is used (`Aspect.invoke`)
      if (declaration === undefined) continue

      let storage = this.made.get(name)

      if (storage === undefined) {
        // the annotation is validated above, so a declaration is its provider's
        storage = this.createStorage(name, declaration as Declaration)
        this.made.set(name, storage)
      }

      storages[name] = await storage
    }

    return storages
  }

  private async createStorage(name: string, declaration: Declaration): Promise<Storage> {
    const { provider: id, ...options } = declaration
    const Provider: Constructor = await load(id)
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

      if (secret.optional !== true && value === undefined)
        throw new Error(`'${variable}' is not defined`)

      secrets[secret.name] = value
    }

    return secrets
  }
}
