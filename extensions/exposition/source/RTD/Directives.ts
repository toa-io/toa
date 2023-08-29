import type * as syntax from './syntax'

export interface Directives<T> {
  merge: (directive: T) => void
}

export interface DirectivesFactory<T = any> {
  create: (directives: syntax.Directive[]) => T
}
