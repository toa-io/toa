import { type IncomingMessage, type OutgoingMessage } from './HTTP'
import { type Remotes } from './Remotes'
import type * as RTD from './RTD'

export class Directives {
  private readonly directives: DirectiveSet[]

  public constructor (directives: DirectiveSet[]) {
    this.directives = directives
  }

  public async apply (request: IncomingMessage, parameters: RTD.Parameter[]): Promise<Output> {
    for (const directive of this.directives) {
      const output = await directive.family.apply(directive.directives, request, parameters)

      if (output !== null)
        return output
    }

    return null
  }
}

export class DirectivesFactory implements RTD.DirectivesFactory<Directives> {
  private readonly families: Record<string, Family> = {}
  private readonly remtoes: Remotes

  public constructor (families: Family[], remotes: Remotes) {
    for (const family of families)
      this.families[family.name] = family

    this.remtoes = remotes
  }

  public create (declarations: RTD.syntax.Directive[]): Directives {
    const groups: Record<string, any> = {}

    for (const declaration of declarations) {
      const family = this.families[declaration.family]

      if (family === undefined)
        throw new Error(`Directive family '${declaration.family}' not found.`)

      const directive = family.create(declaration.name, declaration.value, this.remtoes)

      groups[declaration.family] ??= []
      groups[declaration.family].push(directive)
    }

    const sets: DirectiveSet[] = []

    for (const [family, directives] of Object.entries(groups))
      sets.push({
        family: this.families[family],
        directives
      })

    return new Directives(sets)
  }
}

export interface Family<IDirective = any> {
  readonly name: string

  create: (name: string, value: any, remotes: Remotes) => IDirective
  apply: (directives: IDirective[],
    request: Input,
    parameters: RTD.Parameter[]) => Output | Promise<Output>
}

interface DirectiveSet {
  family: Family
  directives: any[]
}

export type Input = IncomingMessage
export type Output = OutgoingMessage | null
