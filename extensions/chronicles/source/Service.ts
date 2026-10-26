import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { ENCOUNTERS, NAMESPACE, SERVICE } from '@toa.io/definitions/extensions.chronicles'
import { Recorder, type Kind } from './Recorder.ts'
import type { Contract } from '@toa.io/definitions/extensions.chronicles'
import type { Publisher } from './Publisher.ts'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'
import type { extensions } from '@toa.io/core/types'

/**
 * The extension's own service: a consumer of every event the log is kept of — one group for every
 * replica, so each event is published once — and the components it ships: the queries, the relay,
 * and the encounters where the annotation asks for them. Nothing of it waits for the broker the
 * rows are published to.
 */
export class Service extends Connector {
  private readonly host: extensions.Host
  private readonly settings: Settings
  private readonly publisher: Publisher

  // eslint-disable-next-line max-params
  public constructor(host: extensions.Host, settings: Settings, publisher: Publisher) {
    super()

    this.host = host
    this.settings = settings
    this.publisher = publisher

    this.depends(publisher)
  }

  /** first of all, so what waits for the broker of the log holds up none of what closes after */
  protected override async close(): Promise<void> {
    this.publisher.stop()
  }

  protected override async open(): Promise<void> {
    const consumed: Array<[string, Kind, Contract]> = [
      ...Object.entries(this.settings.events).map(
        ([label, contract]): [string, Kind, Contract] => [label, 'event', contract]
      ),
      ...Object.entries(this.settings.states).map(
        ([label, contract]): [string, Kind, Contract] => [label, 'state', contract]
      )
    ]

    for (const [label, kind, contract] of consumed) {
      // an event that is both a row and a state is two consumers, each of a group of its own
      const group = kind === 'state' ? `${GROUP}.states` : GROUP
      const of = {
        contract,
        identity: this.settings.identities[component(label)] ?? null,
        timestamp: this.settings.timestamps[component(label)] ?? null
      }

      const recorder = new Recorder(label, kind, of, this.publisher)
      const consumer = await this.host.receive(label, group, recorder)

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

function component(label: string): string {
  return label.slice(0, label.lastIndexOf('.'))
}

function paths(settings: Settings): string[] {
  return components().paths.filter(
    (path) => settings.encounters || !path.endsWith(`${NAMESPACE}.${ENCOUNTERS}`)
  )
}

interface Components {
  labels: string[]
  paths: string[]
}

const ROOT = resolve(import.meta.dirname, '../components/')
const GROUP = `${NAMESPACE}.${SERVICE}`
