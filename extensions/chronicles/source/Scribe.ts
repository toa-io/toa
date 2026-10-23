import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { INGEST, NAMESPACE } from '@toa.io/definitions/extensions.chronicles'
import { Provisioning } from './Provisioning.ts'
import type { Channel } from './Channel.ts'
import type { ClickHouse } from './ClickHouse.ts'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'
import type { extensions } from '@toa.io/core/types'

/**
 * The extension's own service: ClickHouse provisioned, then the components it ships — the
 * query, and the client route where the annotation asks for it.
 */
export class Scribe extends Connector {
  private readonly host: extensions.Host
  private readonly provisioning: Provisioning
  private readonly settings: Settings

  // eslint-disable-next-line max-params
  public constructor(
    host: extensions.Host,
    channel: Channel,
    writer: ClickHouse,
    settings: Settings,
    password: string
  ) {
    super()

    this.host = host
    this.settings = settings
    this.provisioning = new Provisioning(channel, writer, settings, password)
  }

  protected override async open(): Promise<void> {
    await this.provisioning.connect()

    this.depends(this.provisioning)

    const composition = await this.host.composition(paths(this.settings))

    await composition.connect()

    this.depends(composition)
  }
}

/** The components this extension ships, which run inside its own service. */
export function components(): Components {
  const labels: string[] = []
  const paths: string[] = []

  for (const entry of readdirSync(ROOT, { withFileTypes: true }))
    if (entry.isDirectory()) {
      labels.push(entry.name.replace('.', '-'))
      paths.push(resolve(ROOT, entry.name))
    }

  return { labels, paths }
}

function paths(settings: Settings): string[] {
  return components().paths.filter(
    (path) => settings.ingest || !path.endsWith(`${NAMESPACE}.${INGEST}`)
  )
}

interface Components {
  labels: string[]
  paths: string[]
}

const ROOT = resolve(import.meta.dirname, '../components/')
