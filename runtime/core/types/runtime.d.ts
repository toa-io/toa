import type * as types from '.'

declare namespace toa.core {

    interface Runtime extends types.Connector {
        locator: types.Locator

        invoke(endpoint: string, request: types.Request): Promise<types.Reply>
    }

}

export type Runtime = toa.core.Runtime
