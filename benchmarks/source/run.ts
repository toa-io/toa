import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fixtures from './fixtures.ts'
import { free, Stack } from './stack.ts'
import { place, read as topology } from './topology.ts'
import { git } from './trees.ts'
import type { Files, Tokens } from './fixtures.ts'
import type { Ports } from './processes.ts'
import type { Placement } from './topology.ts'

export type SideName = 'base' | 'head'

export interface Pair<T> {
  base: T
  head: T
}

export interface Timing {
  blocks: number
  /** seconds a measured window lasts */
  window: number
  warmup: number
}

/** What one invocation works with. */
export interface Run {
  fixtures: string
  cache: string
  results: string
  /** logs, temporary files and bodies of this run */
  directory: string
  placement: Placement
  secret: string
  tokens: Tokens
  files: Files
  timing: Timing
  stack: Stack
}

export const REPOSITORY = git(dirname(fileURLToPath(import.meta.url)), 'rev-parse', '--show-toplevel')
export const CACHE = process.env.TOA_BENCH_CACHE ?? join(homedir(), '.cache/toa-bench')

/** The two sides differ in names only: contexts of one length, ports of one block. */
export const SIDES: Record<SideName, { name: SideName; context: string; ports: Ports }> = {
  base: { name: 'base', context: 'toa-bench-a', ports: { gateway: 31090, probe: 31092, ready: [31094, 31095, 31098] } },
  head: { name: 'head', context: 'toa-bench-b', ports: { gateway: 31091, probe: 31093, ready: [31096, 31097, 31099] } }
}

export async function open(timing: Timing): Promise<Run> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const results = join(REPOSITORY, 'benchmarks/results', stamp)
  const directory = join(CACHE, 'runs', stamp)

  await free(Object.values(SIDES).flatMap(({ ports }) => [ports.gateway, ports.probe, ...ports.ready]))
  await mkdir(results, { recursive: true })
  await mkdir(directory, { recursive: true })

  const secret = fixtures.key()
  const stack = new Stack()

  await stack.connect()

  console.log(`Results: ${results}\nLogs: ${join(directory, 'logs')}`)

  return {
    fixtures: join(REPOSITORY, 'benchmarks/fixtures'),
    cache: CACHE,
    results,
    directory,
    placement: place(topology()),
    secret,
    tokens: await fixtures.tokens(secret),
    files: await fixtures.files(directory),
    timing,
    stack
  }
}
