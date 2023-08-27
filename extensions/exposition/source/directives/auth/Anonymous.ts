import { type Directive, type Identity } from './types'

export class Anonymous implements Directive {
  private readonly allow: boolean

  public constructor (allow: boolean) {
    this.allow = allow
  }

  public authorize (identity: Identity | null): boolean {
    if (identity === null) return this.allow
    else return false
  }
}
