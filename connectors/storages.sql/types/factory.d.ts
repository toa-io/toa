// noinspection ES6UnusedImports

import type { Locator } from '@toa.io/core'
import type { Factory } from '@toa.io/core/types/storages'
import type { Storage } from './storage'

type Base = Factory

declare namespace toa.sql{

  interface Factory extends Base{

    storage (locator: Locator): Storage

  }

}
