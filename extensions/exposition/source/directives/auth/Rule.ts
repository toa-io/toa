import { type Parameter } from '../../RTD/index.js'
import type { Context, Directive, Identity, Create } from './types.js'

export class Rule implements Directive {
  private readonly directives: Directive[] = []

  public constructor (directives: Record<string, any>, create: Create) {
    for (const [name, value] of Object.entries(directives)) {
      const directive = create(name, value)

      this.directives.push(directive)
    }
  }

  public async authorize (identity: Identity | null, context: Context, parameters: Parameter[]): Promise<boolean> {
    for (const directive of this.directives) {
      const authorized = await directive.authorize(identity, context, parameters)

      if (!authorized)
        return false
    }

    return true
  }

  /** All of them, so one that refuses ends it and one that cannot tell leaves it untold. */
  public async admits (identity: Identity | null, context: Context): Promise<boolean | undefined> {
    let untold = false

    for (const directive of this.directives) {
      const admits = await directive.admits?.(identity, context)

      if (admits === undefined) {
        untold = true

        continue
      }

      if (!admits)
        return false
    }

    return untold ? undefined : true
  }
}
