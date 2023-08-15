import { decode } from 'msgpackr'
import { resolve, type URIMap } from '@toa.io/pointer'
import { memo } from '@toa.io/generic'
import { type Protocol, protocols } from './protocols'
import { ENV_PREFIX, ID_PREFIX, PROPERTIES_SUFFIX } from './extension'
import type { Properties } from './annotation'
import type { Locator, extensions } from '@toa.io/core'
import type { Manifest } from './manifest'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator, manifest: Manifest): extensions.Aspect[] {
    return protocols.map((protocol) => this.createAspect(locator, manifest, protocol))
  }

  private createAspect (locator: Locator, manifest: Manifest, protocol: Protocol):
  extensions.Aspect {
    const resolver = this.resolver(locator, manifest, protocol)

    return protocol.create(resolver)
  }

  private resolver (locator: Locator, manifest: Manifest, protocol: Protocol): Resolver {
    return memo(async (): Promise<Configuration> => {
      const uris = await this.getURIs(locator, manifest)
      const allProperties = this.getProperties(locator)

      const origins = this.filterOrigins(uris, protocol.protocols)
      const properties = allProperties['.' + protocol.id as keyof Properties] ?? {}

      return { origins, properties }
    })
  }

  private async getURIs (locator: Locator, manifest: Manifest): Promise<URIMap> {
    const map: URIMap = {}

    if (manifest === null) return map

    for (const [name, value] of Object.entries(manifest))
      try {
        map[name] = await this.readOrigin(locator, name)
      } catch {
        // eslint-disable-next-line max-depth
        if (value === null) throw new Error(`Origin value ${name} is not defined`)

        map[name] = [value]
      }

    return map
  }

  private filterOrigins (uris: URIMap, protocols: string[]): URIMap {
    const filtered: URIMap = {}

    for (const [name, references] of Object.entries(uris)) {
      const url = new URL(references[0])

      if (protocols.includes(url.protocol))
        filtered[name] = references
    }

    return filtered
  }

  private async readOrigin (locator: Locator, name: string): Promise<string[]> {
    const id = ID_PREFIX + locator.label

    return await resolve(id, name)
  }

  private getProperties (locator: Locator): Properties {
    const variable = ENV_PREFIX + locator.uppercase + PROPERTIES_SUFFIX
    const value = process.env[variable]

    if (value === undefined) return {}

    const buffer = Buffer.from(value, 'base64')

    return decode(buffer)
  }
}

export interface Configuration {
  origins: URIMap
  properties: Record<string, boolean>
}

export type Resolver = () => Promise<Configuration>
