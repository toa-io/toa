import { decode } from 'msgpackr'
import { resolve, type URIMap } from '@toa.io/pointer'
import { protocols, type Protocol } from './protocols'
import { ENV_PREFIX, ID_PREFIX, PROPERTIES_SUFFIX } from './extension'
import type { Properties } from './annotation'
import type { Locator, extensions } from '@toa.io/core'
import type { Manifest } from './manifest'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator, manifest: Manifest): extensions.Aspect[] {
    const uris = this.getURIs(locator, manifest)
    const properties = this.getProperties(locator)

    return protocols.map((protocol) => this.createAspect(protocol, uris, properties))
  }

  private createAspect (protocol: Protocol, uris: URIMap, properties: Properties):
  extensions.Aspect {
    const protocolOrigins = this.filterOrigins(uris, protocol.protocols)
    const protocolProperties = properties['.' + protocol.id as keyof Properties] ?? {}

    return protocol.create(protocolOrigins, protocolProperties)
  }

  private getURIs (locator: Locator, manifest: Manifest): URIMap {
    const map: URIMap = {}

    if (manifest === null) return map

    for (const [name, value] of Object.entries(manifest))
      map[name] = value !== null ? [value] : this.readOrigin(locator, name)

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

  private readOrigin (locator: Locator, name: string): string[] {
    const id = ID_PREFIX + locator.label

    return resolve(id, name)
  }

  private getProperties (locator: Locator): Properties {
    const variable = ENV_PREFIX + locator.uppercase + PROPERTIES_SUFFIX
    const value = process.env[variable]

    if (value === undefined) return {}

    const buffer = Buffer.from(value, 'base64')

    return decode(buffer)
  }
}
