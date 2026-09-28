import { console } from 'openspan'
import type { Destination, Regional as Declaration, Row } from './types/outbox.ts'

/**
 * The component's regional destinations, as a carrier is given them. The carrier puts what they
 * export beside what it carries and hands it back where it arrives; which destination a part is
 * for, and what it holds, is theirs.
 */
export class Regional implements Declaration {
  readonly #destinations: Map<string, Destination>

  public constructor(destinations: Destination[]) {
    this.#destinations = new Map(
      destinations.map((destination) => [destination.name, destination])
    )
  }

  /** Whether a destination writes to something each region keeps for itself. */
  public static is(destination: Destination): boolean {
    return destination.export !== undefined && destination.import !== undefined
  }

  /**
   * One destination failing to say what it would write takes out its own part and nothing else:
   * the carrier carries state, and state is not held back by what the others write beside it.
   */
  public async export(row: Row): Promise<Record<string, unknown> | undefined> {
    const exports = [...this.#destinations].map(async ([name, destination]) => {
      try {
        return [name, await destination.export!(row)] as const
      } catch (error) {
        console.error('Regional export failed', {
          row: row.id,
          destination: name,
          message: (error as Error)?.message
        })

        return [name, undefined] as const
      }
    })

    const parts = (await Promise.all(exports)).filter(([, part]) => part !== undefined)

    return parts.length === 0 ? undefined : Object.fromEntries(parts)
  }

  /**
   * What fails, fails the import: the change is delivered again, and imported again. Not before
   * every part has landed or failed, so that nothing is still being written when it is.
   */
  public async import(carried: Record<string, unknown>): Promise<void> {
    const imports = Object.entries(carried).map(async ([name, part]) => {
      const destination = this.#destinations.get(name)

      if (destination === undefined) {
        console.debug('Regional import has no destination', { destination: name })

        return
      }

      await destination.import!(part)
    })

    const failed = (await Promise.allSettled(imports)).find(
      (outcome) => outcome.status === 'rejected'
    )

    if (failed !== undefined) throw failed.reason
  }
}
