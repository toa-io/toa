// noinspection ES6UnusedImports

import type { Error } from './error'

declare namespace toa.libraries.schema {

    type JSON = {
        $id?: string
        type?: string
        properties?: Object
        required?: string[]
        system?: boolean
    }

    interface Schema {
        readonly schema: JSON

        fit(value: any): Error | null

        validate(value: any): void

        match(value: any): Error | null

        defaults(value?: any): Object

        system(): Object
    }

}
