import type * as syntax from './syntax'

export interface Directives<TDirective = any> {
  merge: (directive: TDirective) => void
}

export interface DirectivesFactory<T = any> {
  create: (directives: syntax.Directive[]) => T
}
