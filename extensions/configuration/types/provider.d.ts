import { Source } from '@toa.io/core/types/reflection'
import { Connector } from '@toa.io/core/types'

declare namespace toa.extensions.configuration {

    interface Provider extends Connector {
        source: Source
        object: Object

        set(key: string, value: any): void

        unset(key: string): void

        reset(): void

        export(): string
    }

}

export type Provider = toa.extensions.configuration.Provider
