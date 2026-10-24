import { console } from 'openspan'
import type { Provider, Row } from './Provider.ts'

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

  public async write(rows: Row[]): Promise<void> {
    const batch = (this.pending ??= this.open())

    batch.rows.push(...rows)

    if (batch.rows.length >= SIZE) this.flush(batch)

    await batch.written
  }

  private open(): Batch {
    let settle!: (error?: unknown) => void

    const written = new Promise<void>((resolve, reject) => {
      settle = (error) => (error === undefined ? resolve() : reject(error))
    })

    const batch: Batch = { rows: [], written, settle, timer: null }

    batch.timer = setTimeout(() => this.flush(batch), WAIT)

    return batch
  }

  private flush(batch: Batch): void {
    if (this.pending === batch) this.pending = null

    if (batch.timer === null) return

    clearTimeout(batch.timer)
    batch.timer = null

    this.provider.write(batch.rows).then(
      () => batch.settle(),
      (error: unknown) => {
        console.warn('Chronicles failed to write', {
          rows: batch.rows.length,
          error: error instanceof Error ? error.message : String(error)
        })

        batch.settle(error)
      }
    )
  }
}

interface Batch {
  rows: Row[]
  written: Promise<void>
  settle: (error?: unknown) => void
  timer: NodeJS.Timeout | null
}

/** rows that make a batch full, and milliseconds a batch waits for more */
const SIZE = 1000
const WAIT = 500
