import { Source } from '@toa.io/core/types/reflection'

declare namespace toa.extensions.configuration {

    interface Provider {
        source: Source
    }

}
