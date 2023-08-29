import { type Method, type MethodFactory } from './Method'
import { type DirectivesFactory } from './Directives'

export interface Context<IMethod extends Method = any, IDirective = any, IExtension = any> {
  readonly protected: boolean
  readonly methods: MethodFactory<IMethod>
  readonly directives: {
    readonly factory: DirectivesFactory
    stack: IDirective[]
  }
  readonly extension?: IExtension
}
