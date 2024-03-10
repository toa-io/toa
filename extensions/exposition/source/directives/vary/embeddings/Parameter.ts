import type { Embedding } from './Embedding'
import type * as RTD from '../../../RTD'

export class Parameter implements Embedding {
  private readonly name: string

  public constructor (name: string) {
    this.name = name
  }

  public resolve (_: unknown, __: unknown, parameters: RTD.Parameter[]): string | undefined {
    return parameters.find((parameter) => parameter.name === this.name)?.value
  }
}
