import { type Component } from '@toa.io/core'

export interface Context {
  protected: boolean
  discovery?: Promise<Component>
}
