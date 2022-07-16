// noinspection ES6UnusedImports

import type { Locator, storages } from '@toa.io/core/types'
import type { Storage } from './storage'

declare namespace toa.sql {

  interface Factory {
    storage(locator: Locator): Storage
  }

}
