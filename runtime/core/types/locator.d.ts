export class Locator {
  public readonly name: string
  public readonly namespace: string

  public readonly id: string
  public readonly label: string
  public readonly uppercase: string

  constructor (name: string, namespace: string)

  hostname (type?: string): string
}
