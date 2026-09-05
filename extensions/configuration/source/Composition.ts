import { readdirSync, type Dirent } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { uiPort } from './const.js'
import { UI } from './UI.js'
import type { Host } from './Factory.js'

/** Hosts the values component in the service process. */
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

    // connected here rather than declared as a dependency: dependencies are connected
    // before `open` runs, so one added from inside it would never be
    const ui = new UI(uiPort())

    await ui.connect()

    this.depends(ui)
  }
}

export function components (): Components {
  const labels: string[] = []
  const paths: string[] = []

  for (const entry of entries()) {
    labels.push(entry.name.replace('.', '-'))
    paths.push(resolve(ROOT, entry.name))
  }

  return { labels, paths }
}

function entries (): Dirent[] {
  const entries = readdirSync(ROOT, { withFileTypes: true })

  return entries.filter((entry) => entry.isDirectory())
}

interface Components {
  labels: string[]
  paths: string[]
}

const ROOT = resolve(import.meta.dirname, '../components/')
