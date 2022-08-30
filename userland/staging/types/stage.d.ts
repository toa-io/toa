import * as _core from '@toa.io/core/types'

declare namespace toa.userland.staging {

  type Stage = {
    reset: () => void
    components: _core.Component[]
  }

}
