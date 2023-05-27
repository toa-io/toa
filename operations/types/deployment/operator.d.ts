// noinspection ES6UnusedImports

import * as _deployment from './deployment'
import * as _dependency from './dependency'

declare namespace toa.deployment {

  interface Operator {
    export(path?: string): Promise<string>

    prepare(path?: string): Promise<string>

    push(): Promise<void>

    install(options?: _deployment.installation.Options): Promise<void>

    template(options?: _deployment.template.Options): Promise<string>

    variables(): _dependency.dependency.Variables
  }

}

export type Operator = toa.deployment.Operator
