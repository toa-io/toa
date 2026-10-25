import { environment } from '@toa.io/generic'
import { ClickHouseProvider } from './clickhouse/Provider.ts'
import type { Provider } from './Provider.ts'
import type { Credentials } from './settings.ts'
import type { Settings } from '@toa.io/definitions/extensions.chronicles'

/** The provider the annotation names, keeping the log under the scope of the process. */
export function provider(settings: Settings, credentials: Credentials): Provider {
  switch (settings.store.provider) {
    case 'clickhouse':
      return new ClickHouseProvider(
        settings.store.url,
        environment.scope(),
        credentials,
        settings.retention
      )
    default:
      throw new Error(`Chronicles have no store '${String(settings.store.provider)}'`)
  }
}
