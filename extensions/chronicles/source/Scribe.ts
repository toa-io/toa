import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { INGEST, NAMESPACE, SERVICE } from '@toa.io/definitions/extensions.chronicles'
import { Recorder } from './Recorder.ts'
import type { Provider } from './Provider.ts'
import type { Writer } from './Writer.ts'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'
import type { extensions } from '@toa.io/core/types'

/**
 * The extension's own service: the store provisioned, then a consumer of every event the log is
 * kept of — one group for every replica, so each event is written once — and the components it
 * ships: the query, the facts, and the client route where the annotation asks for it.
 */
export class Scribe extends Connector {
  private readonly host: extensions.Host
  private readonly settings: Settings
  private readonly provider: Provider
  private readonly writer: Writer

  // eslint-disable-next-line max-params
  public constructor(
    host: extensions.Host,
    settings: Settings,
    provider: Provider,
    writer: Writer
  ) {
    super()

    this.host = host
    this.settings = settings
    this.provider = provider
    this.writer = writer
  }

  protected override async open(): Promise<void> {
    await this.provider.provision()

    for (const label of this.settings.events) {
      const consumer = await this.host.receive(
        label,
        GROUP,
        new Recorder(label, this.writer)
      )

      this.depends(consumer)
      await consumer.connect()
    }

    const composition = await this.host.composition(paths(this.settings))

    this.depends(composition)
    await composition.connect()
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
const GROUP = `${NAMESPACE}.${SERVICE}`
