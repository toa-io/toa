import { concat } from '@toa.io/generic'

/** Where a component is, as every name derived from it. */
export class Locator {
  public readonly name: string
  public readonly namespace: string | undefined

  public readonly id: string
  public readonly label: string
  public readonly uppercase: string
  public readonly lowercase: string

  public constructor (name: string, namespace?: string) {
    if (name === undefined) throw new TypeError('Locator name must be defined')

    this.name = name
    this.namespace = namespace

    this.id = concat(namespace, '.') + name
    this.label = (concat(namespace, '-') + name).toLowerCase()
    this.uppercase = (concat(namespace, '_') + name).toUpperCase()
    this.lowercase = (concat(namespace, '_') + name).toLowerCase()
  }

  public static parse (string: string): Locator {
    const [namespace, name] = string.split(DOT)

    if (name === undefined)
      return new Locator(namespace)
    else
      return new Locator(name, namespace)
  }

  public hostname (prefix?: string): string {
    return concat(prefix?.toLowerCase(), '-') + this.label
  }
}

const DOT = '.'
