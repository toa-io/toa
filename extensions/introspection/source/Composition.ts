import { readdirSync, type Dirent } from 'node:fs'
import { resolve } from 'node:path'
import { Connector } from '@toa.io/core'
import { type Bootloader } from './Factory'
import type { Annotation } from './annotation'

/** Hosts the introspection components in the explorer process. */
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
  }
}

export function find (): string[] {
  return entries().map((entry) => resolve(ROOT, entry.name))
}

function entries (): Dirent[] {
  const entries = readdirSync(ROOT, { withFileTypes: true })

  return entries.filter((entry) => entry.isDirectory())
}

/**
 * The extension is predefined, so an application that turns introspection off
 * must not end up with the explorer components — nor with the exposition
 * dependency they bring in.
 */
export function components (annotation?: Annotation): Components {
  if (annotation === false)
    return { labels: [], paths: [] }

  const labels: string[] = []
  const paths: string[] = []

  for (const entry of entries()) {
    labels.push(entry.name.replace('.', '-'))
    paths.push(resolve(ROOT, entry.name))
  }

  return { labels, paths }
}

interface Components {
  labels: string[]
  paths: string[]
}

const ROOT = resolve(__dirname, '../components/')
