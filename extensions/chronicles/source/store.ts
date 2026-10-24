import { ClickHouseProvider } from './clickhouse/Provider.ts'
import type { Provider } from './Provider.ts'
import type { Credentials } from './settings.ts'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'

/** The provider the annotation names. */
export function provider(settings: Settings, credentials: Credentials): Provider {
  switch (settings.store.provider) {
    case 'clickhouse':
      return new ClickHouseProvider(settings.store.url, credentials, settings.retention)
    default:
      throw new Error(`Chronicles have no store '${String(settings.store.provider)}'`)
  }
}
