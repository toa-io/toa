import { type MethodFactory } from './Method'

// import { type DirectiveFactory } from './Directive'

export interface Context<Extension = any> {
  protected: boolean
  readonly methods: MethodFactory
  // readonly directives: DirectiveFactory
  readonly extension?: Extension
}
