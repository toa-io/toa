// noinspection ES6UnusedImports

import * as core from '@toa.io/core/types/extensions'

declare namespace toa.extensions.configuration {

  interface Annex extends core.Annex {
    invoke(path?: string[]): any
  }

}
