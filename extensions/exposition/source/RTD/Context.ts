import { type Component } from '@toa.io/core'
import { type Remotes } from '../Remotes'

export interface Context {
  protected: boolean
  discovery?: Promise<Component>
  remotes?: Remotes
}
