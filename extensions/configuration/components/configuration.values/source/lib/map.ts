/** What the deployment told the service about every configured component. */
export function entry (component: string): Entry | undefined {
  return read()[component]
}

/** The configured components, by name. */
export function components (): string[] {
  return Object.keys(read()).sort()
}

function read (): Values {
  const source = process.env[VARIABLE] ?? '{}'

  // read again once the variable changes, as it does between scenarios of one process
  if (source !== parsed) {
    values = JSON.parse(source) as Values
    parsed = source
  }

  return values
}

let parsed: string | null = null
let values: Values = {}

export const VARIABLE = 'TOA_CONFIGURATION_VALUES'

export interface Entry {
  epoch: string
  schema: object
  defaults?: object
}

export type Values = Record<string, Entry>
