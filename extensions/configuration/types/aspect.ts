// noinspection ES6UnusedImports

import * as core from '@toa.io/core/types/extensions'

declare namespace toa.extensions.configuration {

  interface Aspect extends core.Aspect {
    invoke(path?: string[]): any
  }

}
