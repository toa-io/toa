import * as http from '../../HTTP'
import { type Directive, type Identity, type Context } from './types'
import { split } from './split'

export class Scheme implements Directive {
  private readonly scheme: string
  private readonly Scheme: string

  public constructor (scheme: string) {
    this.scheme = scheme.toLowerCase()
    this.Scheme = scheme[0].toUpperCase() + scheme.substring(1)
  }

  public authorize (_: Identity | null, context: Context): boolean {
    if (context.request.headers.authorization === undefined)
      return false

    const [scheme] = split(context.request.headers.authorization)

    if (scheme !== this.scheme)
      throw new http.Forbidden(this.Scheme +
        ' authentication scheme is required to access this resource')

    return false
  }
}
