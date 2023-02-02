import * as _core from '@toa.io/core/types'

declare namespace toa.stage.binding {

  type Callback = (message: Object) => Promise<void>
  type Call = (request: Object) => Promise<Object>

  interface Binding {
    subscribe(label: string, callback: Callback): Promise<void>

    emit(label: string, message: Object): Promise<undefined>

    reply(label, call: Call): Promise<Object>
  }

}

export type Factory = _core.bindings.Factory
export const binding: toa.stage.binding.Binding
export const properties: _core.bindings.Properties
