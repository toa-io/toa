import { ClickHouseProvider } from './clickhouse/Provider.ts'
import type { Provider } from './Provider.ts'
import type { User } from './settings.ts'
import type { Store } from '@toa.io/definitions/extensions.chronicles'

/** The provider the annotation names, read as the context's user of it. */
export function provider(store: Store, user: User, scope: string): Provider {
  switch (store.provider) {
    case 'clickhouse':
      return new ClickHouseProvider(store.url, user, scope)
    default:
      throw new Error(`Chronicles have no store '${String(store.provider)}'`)
  }
}
