import { type Parameter } from '../../RTD'
import { type Directive, type Identity } from './types'

export class Rule implements Directive {
  private readonly directives: Directive[] = []

  public constructor (directives: Record<string, any>, create: Create) {
    for (const [name, value] of Object.entries(directives)) {
      const directive = create(name, value)

      this.directives.push(directive)
    }
  }

  public async authorize (identity: Identity | null, parameters: Parameter[]): Promise<boolean> {
    let authorized = true

    for (const directive of this.directives) {
      authorized &&= await directive.authorize(identity, parameters)

      if (!authorized)
        return false
    }

    return true
  }
}

type Create = (name: string, value: any) => Directive
