import * as _core from '@toa.io/core/types'
import * as _request from './request'

declare namespace toa.sampling {

  interface Component extends _core.Component {
    invoke(endpoint: string, request: _request.Request): Promise<_core.Reply>
  }

}
