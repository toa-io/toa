import { readdirSync, type Dirent } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { type Host } from './Factory.js'

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

function entries(): Dirent[] {
  const entries = readdirSync(ROOT, { withFileTypes: true })

  return entries.filter((entry) => entry.isDirectory())
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
