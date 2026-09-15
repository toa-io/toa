import { readdirSync, type Dirent } from 'node:fs'
import { resolve } from 'node:path'
import type { Connector } from '@toa.io/core'
import { type Host } from './Factory.ts'

/**
 * The components the gateway runs itself, composed before its tree is built: what they provide
 * is what the process composing them states, and a directive made with the tree is given it.
 */
export async function composition(host: Host): Promise<Connector> {
  return await host.composition(find())
}

function find(): string[] {
  return entries().map((entry) => resolve(ROOT, entry.name))
}

function entries(): Dirent[] {
  const entries = readdirSync(ROOT, { withFileTypes: true })

  return entries.filter((entry) => entry.isDirectory())
}

export function components(): Components {
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

const ROOT = resolve(import.meta.dirname, '../components/')
