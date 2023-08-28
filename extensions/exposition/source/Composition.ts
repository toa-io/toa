import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { type Bootloader } from './Factory'

export class Composition extends Connector {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  protected override async open (): Promise<void> {
    const paths = await find()
    const composition = await this.boot.composition(paths)

    await composition.connect()

    this.depends(composition)

    console.info('Composition complete.')
  }

  protected override dispose (): void {
    console.info('Composition shutdown complete.')
  }
}

async function find (): Promise<string[]> {
  const entries = await readdir(ROOT, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(entry.path, entry.name))
}

const ROOT = resolve(__dirname, '../components/')
