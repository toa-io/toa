// noinspection ES6UnusedImports

import { Factory } from '@toa.io/core/types/extensions'
import { Component } from '@toa.io/formation'
import { Provider } from './provider'

type Extension = Factory

declare namespace toa.extensions.configuration {

    interface Factory extends Extension {
        provider(component: Component): Provider
    }

}
