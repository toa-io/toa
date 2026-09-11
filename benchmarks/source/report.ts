import type { Counts } from './counters.ts'
import type { Estimate, Verdict } from './statistics.ts'

export interface Report {
  base: Revision
  head: Revision
  machine: Machine
  blocks: number
  threshold: number
  scenarios: Array<ScenarioReport | Unsupported>
}

export interface Revision {
  ref: string
  sha: string
}

export interface Machine {
  model: string
  cpus: number
  governor: string | null
  pinned: boolean
}

export interface ScenarioReport {
  id: string
  /** requests per second every window was sent at */
  rate: number
  processes: ProcessReport[]
  counts: { base: Counts; head: Counts }
  latency: { base: Latency; head: Latency }
  /** the largest share of the measured cores other processes took in a window; `null` unpinned */
  busy: number | null
  memory?: { base: Record<string, number>; head: Record<string, number> }
}

export interface ProcessReport {
  name: string
  /** medians of µs of CPU per request */
  base: number
  head: number
  estimate: Estimate
  verdict: Verdict
}

export interface Latency {
  p50: number
  p99: number
}

export interface Unsupported {
  id: string
  unsupported: string
}

export function markdown(report: Report): string {
  const { base, head, machine, blocks, threshold } = report
  const measured = report.scenarios.filter((scenario): scenario is ScenarioReport => !('unsupported' in scenario))
  const unsupported = report.scenarios.filter((scenario): scenario is Unsupported => 'unsupported' in scenario)

  const lines = [
    `# ${head.ref} (${head.sha.slice(0, 7)}) against ${base.ref} (${base.sha.slice(0, 7)})`,
    '',
    `${machine.model}, ${machine.cpus} CPUs, governor ${machine.governor ?? 'unknown'}, ` +
      `${machine.pinned ? 'pinned' : 'unpinned'} · ${blocks} blocks · threshold ±${percent(threshold)} · 95% intervals`,
    '',
    '## CPU per request',
    '',
    '| scenario | process | base µs | head µs | ratio | interval | verdict |',
    '| --- | --- | ---: | ---: | ---: | --- | --- |'
  ]

  for (const scenario of measured)
    for (const process of scenario.processes) {
      const { estimate } = process
      const verdict = process.verdict === 'slower' || process.verdict === 'faster' ? `**${process.verdict}**` : process.verdict

      lines.push(
        row([
          scenario.id,
          process.name,
          process.base.toFixed(0),
          process.head.toFixed(0),
          estimate.ratio.toFixed(3),
          `${estimate.low.toFixed(3)} – ${estimate.high.toFixed(3)}`,
          verdict
        ])
      )
    }

  lines.push(
    '',
    '## Messages and database operations per request',
    '',
    '| scenario | published, base | published, head | operations, base | operations, head | |',
    '| --- | ---: | ---: | ---: | ---: | --- |'
  )

  for (const { id, counts } of measured) {
    const changed =
      Math.abs(counts.head.publish - counts.base.publish) > COUNT ||
      Math.abs(counts.head.operations - counts.base.operations) > COUNT

    lines.push(
      row([
        id,
        counts.base.publish.toFixed(2),
        counts.head.publish.toFixed(2),
        counts.base.operations.toFixed(2),
        counts.head.operations.toFixed(2),
        changed ? '**changed**' : ''
      ])
    )
  }

  lines.push(
    '',
    '## Latency at the fixed rate, ms',
    '',
    '| scenario | rate | p50, base | p50, head | p99, base | p99, head | others busy |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'
  )

  for (const { id, rate, latency, busy } of measured)
    lines.push(
      row([
        id,
        String(rate),
        latency.base.p50.toFixed(2),
        latency.head.p50.toFixed(2),
        latency.base.p99.toFixed(2),
        latency.head.p99.toFixed(2),
        busy === null ? '—' : `${percent(busy)}${busy > BUSY ? ' ⚠' : ''}`
      ])
    )

  if (unsupported.length > 0) {
    lines.push('', '## Unsupported by the base revision', '')

    for (const { id, unsupported: reason } of unsupported) lines.push(`- ${id}: ${reason}`)
  }

  return lines.join('\n') + '\n'
}

function row(cells: string[]): string {
  return `| ${cells.join(' | ')} |`
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

/** a count that moved by more than this per request changed */
const COUNT = 0.05

/** a window where others took more than this of the measured cores is marked */
const BUSY = 0.1
