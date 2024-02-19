import * as _core from '@toa.io/core'

declare namespace toa.stage{

  type State = {
    reset: () => void
    components: _core.Component[]
    compositions: _core.Connector[]
    services: _core.Connector[]
    remotes: _core.Component[]
  }

}

export type State = toa.stage.State
