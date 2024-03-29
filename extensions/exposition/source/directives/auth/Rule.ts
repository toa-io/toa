import { type Parameter } from '../../RTD'
import type { Input, Directive, Identity } from './types'

export class Rule implements Directive {
  private readonly directives: Directive[] = []

  public constructor (directives: Record<string, any>, create: Create) {
    for (const [name, value] of Object.entries(directives)) {
      const directive = create(name, value)

      this.directives.push(directive)
    }
  }

  public async authorize
  (identity: Identity | null, input: Input, parameters: Parameter[]): Promise<boolean> {
    for (const directive of this.directives) {
      const authorized = await directive.authorize(identity, input, parameters)

      if (!authorized)
        return false
    }

    return true
  }
}

type Create = (name: string, value: any, ...args: any[]) => Directive
