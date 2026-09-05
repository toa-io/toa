import type { Locator } from '@toa.io/core'

/**
 * Creates the database and the tables a component's entity needs. A migration tool's
 * contract, not the runtime's: nothing in core calls it.
 */
export interface Migration {
  disconnect (): Promise<void>

  database (name: string): Promise<void>

  table (database: string, locator: Locator, schema: object, reset?: boolean): Promise<string>
}
