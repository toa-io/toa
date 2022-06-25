import { Source } from '@toa.io/core/types/reflection'
import { Connector } from '@toa.io/core/types'

declare namespace toa.extensions.configuration {

    interface Provider extends Connector {
        source: Source

        set(key: string, value: any): Promise<void>
    }

}

export type Provider = toa.extensions.configuration.Provider
