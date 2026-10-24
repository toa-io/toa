import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { ENCOUNTERS, NAMESPACE, SERVICE } from '@toa.io/definitions/extensions.chronicles'
import { Recorder, type Kind } from './Recorder.ts'
import type { Declared, Provider } from './Provider.ts'
import type { Contract } from '@toa.io/definitions/extensions.chronicles'
import type { Writer } from './Writer.ts'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'
import type { extensions } from '@toa.io/core/types'

/**
 * The extension's own service: the store provisioned and its views of what is declared made, then a
 * consumer of every event the log is kept of — one group for every replica, so each event is written
 * once — and the components it ships: the queries, the facts, and the encounters where the
 * annotation asks for them.
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
    await this.provider.declare(declared(this.settings))

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
      const identity = this.settings.identities[component(label)] ?? null
      const recorder = new Recorder(label, kind, identity, contract, this.writer)
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

/** What the components declare, each a view of the log. */
export function declared(settings: Settings): Declared[] {
  return [
    ...Object.entries(settings.events).map(([label, contract]): Declared => ({
      kind: 'event',
      label,
      contract
    })),
    ...Object.entries(settings.facts).map(([label, contract]): Declared => ({
      kind: 'fact',
      label,
      contract
    })),
    ...Object.entries(settings.states).map(([label, contract]): Declared => ({
      kind: 'state',
      component: component(label),
      contract
    }))
  ]
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
