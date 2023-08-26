import { type Parameter } from '../../RTD'
import { type Directive, type Identity } from './types'

export class Id implements Directive {
  private readonly parameter: string

  public constructor (parameter: string) {
    this.parameter = parameter
  }

  public apply (identity: Identity | null, parameters: Parameter[]): boolean {
    if (identity === null)
      return false

    const parameter = parameters.find((parameter) => parameter.name === this.parameter)

    return parameter?.value === identity.id
  }
}
