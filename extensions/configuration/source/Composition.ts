import { readdirSync, type Dirent } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { UI_PORT } from './const'
import { UI } from './UI'
import type { Bootloader } from './Factory'

/** Hosts the values component in the service process. */
export class Composition extends Connector {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  protected override async open (): Promise<void> {
    const composition = await this.boot.composition(components().paths)

    await composition.connect()

    this.depends(composition)
    this.depends(new UI(UI_PORT))
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

const ROOT = resolve(__dirname, '../components/')
