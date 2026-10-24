import { console } from 'openspan'
import type { Encounter, Provider, Row, State } from './Provider.ts'

/**
 * Rows to the provider in batches: what arrives within a moment, or until a batch is full, is
 * one write. Each caller is answered when the write its rows went in is, so a delivery is
 * acknowledged once what it carried is kept, and is delivered again where it was not.
 */
export class Writer {
  private readonly provider: Provider
  private pending: Batch | null = null

  public constructor(provider: Provider) {
    this.provider = provider
  }

  public async write(
    rows: Row[],
    states: State[] = [],
    encounters: Encounter[] = []
  ): Promise<void> {
    const batch = (this.pending ??= this.open())

    batch.rows.push(...rows)
    batch.states.push(...states)
    batch.encounters.push(...encounters)

    if (batch.rows.length + batch.states.length + batch.encounters.length >= SIZE)
      this.flush(batch)

    await batch.written
  }

  private open(): Batch {
    let settle!: (error?: unknown) => void

    const written = new Promise<void>((resolve, reject) => {
      settle = (error) => (error === undefined ? resolve() : reject(error))
    })

    const batch: Batch = {
      rows: [],
      states: [],
      encounters: [],
      written,
      settle,
      timer: null
    }

    batch.timer = setTimeout(() => this.flush(batch), WAIT)

    return batch
  }

  private flush(batch: Batch): void {
    if (this.pending === batch) this.pending = null

    if (batch.timer === null) return

    clearTimeout(batch.timer)
    batch.timer = null

    this.provider.write(batch.rows, batch.states, batch.encounters).then(
      () => batch.settle(),
      (error: unknown) => {
        console.warn('Chronicles failed to write', {
          rows: batch.rows.length,
          states: batch.states.length,
          encounters: batch.encounters.length,
          error: error instanceof Error ? error.message : String(error)
        })

        batch.settle(error)
      }
    )
  }
}

interface Batch {
  rows: Row[]
  states: State[]
  encounters: Encounter[]
  written: Promise<void>
  settle: (error?: unknown) => void
  timer: NodeJS.Timeout | null
}

/** rows that make a batch full, and milliseconds a batch waits for more */
const SIZE = 1000
const WAIT = 500
