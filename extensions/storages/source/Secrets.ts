export type Secrets<K extends string = string> = Record<K | string, string | undefined>

export interface Secret {
  readonly name: string
  readonly optional?: boolean
}
