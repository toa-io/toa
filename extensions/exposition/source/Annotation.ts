export interface Annotation {
  host?: string
  class?: string
  annotations?: Record<string, string>
  debug: boolean
  trace: boolean
  '/'?: object // parsed and validated by RTD.syntax.parse
}
