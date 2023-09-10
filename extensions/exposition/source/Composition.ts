import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { type Dirent } from 'fs'
import { Connector } from '@toa.io/core'
import { type Bootloader } from './Factory'

export class Composition extends Connector {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  protected override async open (): Promise<void> {
    const paths = find()
    const composition = await this.boot.composition(paths)

    await composition.connect()

    this.depends(composition)

    console.info('Composition complete.')
  }

  protected override dispose (): void {
    console.info('Composition shutdown complete.')
  }
}

function find (): string[] {
  return entries().map((entry) => resolve(entry.path, entry.name))
}

function entries (): Dirent[] {
  const entries = readdirSync(ROOT, { withFileTypes: true })

  return entries.filter((entry) => entry.isDirectory())
}

const ROOT = resolve(__dirname, '../components/')

export const componentLabels = entries().map((entry) => entry.name.replace('.', '-'))
export const componentsPaths = find()
