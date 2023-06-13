import type { Component } from '@toa.io/core'

export interface Context {
  namespace: string
  name: string
  remote: Component
}
