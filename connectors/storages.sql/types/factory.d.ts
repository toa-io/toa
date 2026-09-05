// noinspection ES6UnusedImports

import type { Locator } from '@toa.io/core'
import type { storages } from '@toa.io/core/types'
import type { Storage } from './storage.js'

type Base = storages.Factory

declare namespace toa.sql{

  interface storages.Factory extends Base{

    storage (locator: Locator): Storage

  }

}
