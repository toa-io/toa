export interface Properties {
  languages: string[]
}

export class Property<K extends keyof Properties = keyof Properties> {
  public readonly name: K
  public readonly value: Properties[K]

  public constructor (name: K, value: Properties[K]) {
    this.name = name
    this.value = value
  }
}

export const properties = new Set('languages')
