/** What one component declares under `telemetry:`. */
export interface Declaration {
  metrics?: Record<string, Instrument>
}

export interface Instrument {
  type: 'counter' | 'gauge' | 'histogram'

  /** what the values are in */
  unit?: string

  /** histogram bucket upper bounds, ascending */
  buckets?: number[]

  /** label keys, each with the values it admits, or `null` where it admits any */
  labels?: Record<string, Array<string | number | boolean> | null> | null
}
