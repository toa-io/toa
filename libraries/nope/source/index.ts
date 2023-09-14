export class Nope {
  public readonly code: string | number
  public readonly message?: string

  public constructor (properties: Record<string, any>)
  public constructor (code: string | number, properties?: object)
  public constructor (code: string | number, message: string, properties?: object)
  public constructor
  (one: string | number | Record<string, any>, two?: string | object, three?: object) {
    if (typeof one === 'object') {
      this.code = one.code ?? 'UNKNOWN'

      Object.assign(this, one)
    } else {
      this.code = one

      if (typeof two === 'string') {
        this.message = two
        Object.assign(this, three)
      } else
        Object.assign(this, two)
    }
  }
}

export type Nopeable<Yep> = Yep | Nope
