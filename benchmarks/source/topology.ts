import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** `taskset` CPU lists, or `null` where the machine is too small to pin anything. */
export interface Placement {
  gateway: string | null
  components: string | null
  load: string | null
}

/** Physical cores, each the logical CPUs it runs, ordered by the first of them. */
export function cores(siblings: readonly string[]): number[][] {
  const unique = new Map<string, number[]>()

  for (const list of siblings) {
    const cpus = expand(list)

    unique.set(cpus.join(','), cpus)
  }

  return [...unique.values()].sort((a, b) => a[0] - b[0])
}

export function read(): number[][] {
  const lists = readdirSync(ROOT)
    .filter((name) => /^cpu\d+$/.test(name))
    .map((name) => readFileSync(join(ROOT, name, 'topology/thread_siblings_list'), 'utf8').trim())

  return cores(lists)
}

/**
 * The first core is left to the system and the shared services. Both gateways share a set of
 * cores, as both component sets do: only one side is under load at a time.
 */
export function place(topology: readonly number[][]): Placement {
  const logical = topology.reduce((sum, core) => sum + core.length, 0)

  if (logical < 8) return { gateway: null, components: null, load: null }

  const width = logical >= 16 && topology.length >= 8 ? 2 : 1
  const gateway = topology.slice(1, 1 + width)
  const components = topology.slice(1 + width, 1 + 2 * width)
  const load = topology.slice(1 + 2 * width)

  return { gateway: list(gateway), components: list(components), load: list(load) }
}

function expand(list: string): number[] {
  const cpus: number[] = []

  for (const part of list.split(',')) {
    const [from, to = from] = part.split('-').map(Number)

    for (let cpu = from; cpu <= to; cpu++) cpus.push(cpu)
  }

  return cpus.sort((a, b) => a - b)
}

function list(cores: readonly number[][]): string {
  return cores
    .flat()
    .sort((a, b) => a - b)
    .join(',')
}

const ROOT = '/sys/devices/system/cpu'
