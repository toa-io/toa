import type * as syntax from './syntax'

export interface DirectivesFactory<T = any> {
  create: (directives: syntax.Directive[]) => T
}
