export interface Annotation {
  host?: string
  class?: string
  annotations?: Record<string, string>
  '/'?: object // parsed and validated by RTD.syntax.parse
}
