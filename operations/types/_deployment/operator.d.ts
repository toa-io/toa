import * as _deployment from './deployment.d.ts'
import * as _dependency from './dependency.d.ts'

declare namespace toa.deployment {
  interface Operator {
    export(path?: string): Promise<string>

    install(options?: _deployment.installation.Options): Promise<void>

    template(options?: _deployment.template.Options): Promise<string>

    variables(options?: {
      components?: string[]
      services?: string[]
    }): _dependency.Variable[]

    listVariables(): _dependency.Variable[]
  }
}

export type Operator = toa.deployment.Operator
