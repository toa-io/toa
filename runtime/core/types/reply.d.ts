// noinspection ES6UnusedImports

import { Exception } from './exception'

declare namespace toa.core {

    interface Reply {
        output?: Object
        error?: Object
        exception?: Exception
    }

}

export type Reply = toa.core.Reply
