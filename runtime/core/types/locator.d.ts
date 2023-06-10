export class Locator {
  name: string
  namespace: string

  id: string
  label: string
  uppercase: string

  constructor (name: string, namespace?: string)

  hostname (type?: string): string
}
