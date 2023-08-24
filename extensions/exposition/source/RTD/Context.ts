import { type MethodFactory } from './Method'

export interface Context<Extension = any> {
  readonly protected: boolean
  readonly methods: MethodFactory
  readonly extensions?: Extension
}
