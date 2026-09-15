import { readdirSync, type Dirent } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { environment, NAMESPACE, SIGNALS } from '@toa.io/definitions/extensions.introspection'
import { type Host } from './Factory.ts'

/** Hosts the introspection components in the explorer process. */
export class Composition extends Connector {
  private readonly host: Host

  public constructor(host: Host) {
    super()
    this.host = host
  }

  protected override async open(): Promise<void> {
    const paths = find()
    const composition = await this.host.composition(paths)

    await composition.connect()

    this.depends(composition)
  }
}

export function find(): string[] {
  return entries().map((entry) => resolve(ROOT, entry.name))
}

/**
 * The components this process hosts, which is what the deployment provisioned for it: a
 * deployment that has not asked for halts is rendered nothing for the signals component — no
 * storage address among the rest — so a process that hosted it would fail to boot on a pointer
 * nobody wrote.
 */
function entries(): Dirent[] {
  const entries = readdirSync(ROOT, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory()
  )

  if (environment()?.halt === true) return entries

  return entries.filter((entry) => entry.name !== SIGNALS_COMPONENT)
}

/** The components this extension ships, where they are, for the process that runs them. */
export function components(): Components {
  const paths = find()

  return { labels: entries().map((entry) => entry.name.replace('.', '-')), paths }
}

interface Components {
  labels: string[]
  paths: string[]
}

const ROOT = resolve(import.meta.dirname, '../components/')

const SIGNALS_COMPONENT = `${NAMESPACE}.${SIGNALS}`
