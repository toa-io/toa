import { existsSync, readFileSync } from 'node:fs'
import type { Machine } from './report.ts'
import type { Placement } from './topology.ts'

export interface HostTimes {
  busy: number
  total: number
}

export function machine(placement: Placement): Machine {
  const info = readFileSync('/proc/cpuinfo', 'utf8')

  return {
    model: /model name\s*:\s*(.*)/.exec(info)?.[1] ?? 'unknown',
    cpus: info.split('\n').filter((line) => line.startsWith('processor')).length,
    governor: existsSync(GOVERNOR) ? readFileSync(GOVERNOR, 'utf8').trim() : null,
    pinned: placement.gateway !== null
  }
}

/** The CPUs the measured processes run on; `null` where nothing is pinned. */
export function measured(placement: Placement): number[] | null {
  if (placement.gateway === null || placement.components === null) return null

  return `${placement.gateway},${placement.components}`.split(',').map(Number)
}

/** Jiffies the given CPUs spent busy, and in all, since boot. */
export function times(cpus: number[]): HostTimes {
  let busy = 0
  let total = 0

  for (const line of readFileSync('/proc/stat', 'utf8').split('\n')) {
    const match = /^cpu(\d+) (.*)$/.exec(line)

    if (match === null || !cpus.includes(Number(match[1]))) continue

    const [user, nice, system, idle, iowait, irq, softirq, steal] = match[2].trim().split(/\s+/).map(Number)
    const all = user + nice + system + idle + iowait + irq + softirq + steal

    total += all
    busy += all - idle - iowait
  }

  return { busy, total }
}

const GOVERNOR = '/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor'
