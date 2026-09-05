import { readFileSync } from 'node:fs'
import { LEGACY, MODERN, SERVER_INFO, VERSIONS } from './types.js'
import type { MCP } from '../Annotation.js'

/**
 * What a client is told before it calls anything: the revisions served, what is served, and
 * who serves it. It is a function of the annotation alone, so it is built once and answered
 * as it is.
 */
export interface Discovery {
  /** `server/discover`, which the modern revision has replaced the handshake with. */
  modern: object

  /** `initialize`, in the shape a client of an earlier revision reads. */
  legacy: (offered: string | undefined) => object
}

export function discovery (options: MCP): Discovery {
  const info = { name: options.name, version: VERSION }

  // `listChanged` is a stream a client holds open, and this endpoint holds none
  const capabilities = { tools: {} }

  const modern: Record<string, unknown> = {
    supportedVersions: VERSIONS,
    capabilities,
    _meta: { [SERVER_INFO]: info }
  }

  if (options.instructions !== undefined)
    modern.instructions = options.instructions

  function legacy (offered: string | undefined): object {
    const value: Record<string, unknown> = {
      // what the client asked for where that is served, and the newest handshake otherwise
      protocolVersion: offered !== undefined && offered !== MODERN ? offered : LEGACY,
      capabilities,
      serverInfo: info
    }

    if (options.instructions !== undefined)
      value.instructions = options.instructions

    return value
  }

  return { modern, legacy }
}

/** What this gateway is, which is what answers however an application names itself. */
const VERSION: string = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version
