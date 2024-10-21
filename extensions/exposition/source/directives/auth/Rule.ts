import { type Parameter } from '../../RTD'
import type { Context, Directive, Identity, Create } from './types'

export class Rule implements Directive {
  private readonly directives: Directive[] = []

  public constructor (directives: Record<string, any>, create: Create) {
    for (const [name, value] of Object.entries(directives)) {
      const directive = create(name, value)

      this.directives.push(directive)
    }
  }

  public async authorize
  (identity: Identity | null, context: Context, parameters: Parameter[]): Promise<boolean> {
    for (const directive of this.directives) {
      const authorized = await directive.authorize(identity, context, parameters)

      if (!authorized)
        return false
    }

    return true
  }
}
