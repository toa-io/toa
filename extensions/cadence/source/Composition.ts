import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import type { Dirent } from 'node:fs'
import type { Host } from './Factory.js'

/** The components this extension ships, which run inside its own service. */
export function components (): Components {
  const labels: string[] = []
  const paths: string[] = []

  for (const entry of entries()) {
    labels.push(entry.name.replace('.', '-'))
    paths.push(resolve(ROOT, entry.name))
  }

  return { labels, paths }
}

export class Composition extends Connector {
  private readonly host: Host

  public constructor (host: Host) {
    super()

    this.host = host
  }

  protected override async open (): Promise<void> {
    const composition = await this.host.composition(components().paths)

    await composition.connect()

    this.depends(composition)
  }
}

function entries (): Dirent[] {
  return readdirSync(ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory())
}

interface Components {
  labels: string[]
  paths: string[]
}

const ROOT = resolve(import.meta.dirname, '../components/')
