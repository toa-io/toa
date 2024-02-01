import { type IncomingMessage, type OutgoingMessage } from './HTTP'
import { type Remotes } from './Remotes'
import type * as RTD from './RTD'

export class Directives implements RTD.Directives<Directives> {
  private readonly directives: DirectiveSet[]

  public constructor (directives: DirectiveSet[]) {
    this.directives = directives
  }

  public async preflight (request: IncomingMessage, parameters: RTD.Parameter[]): Promise<Output> {
    for (const directive of this.directives) {
      const output = await directive.family.preflight(directive.directives, request, parameters)

      if (output !== null) {
        await this.settle(request, output)

        return output
      }
    }

    return null
  }

  public async settle (request: IncomingMessage, response: OutgoingMessage): Promise<void> {
    for (const directive of this.directives)
      if (directive.family.settle !== undefined)
        await directive.family.settle(directive.directives, request, response)
  }

  public merge (directives: Directives): void {
    this.directives.push(...directives.directives)
  }
}

export class DirectivesFactory implements RTD.DirectivesFactory<Directives> {
  private readonly remtoes: Remotes
  private readonly families: Record<string, Family> = {}
  private readonly mandatory: string[] = []

  public constructor (families: Family[], remotes: Remotes) {
    for (const family of families) {
      this.families[family.name] = family

      if (family.mandatory)
        this.mandatory.push(family.name)
    }

    this.remtoes = remotes
  }

  public create (declarations: RTD.syntax.Directive[]): Directives {
    const groups: Record<string, any> = {}
    const mandatory = new Set(this.mandatory)

    declarations.sort((a, b) =>
      (mandatory.has(b.family) ? 1 : 0) - (mandatory.has(a.family) ? 1 : 0))

    for (const declaration of declarations) {
      const family = this.families[declaration.family]

      if (family === undefined)
        throw new Error(`Directive family '${declaration.family}' is not found.`)

      const directive = family.create(declaration.name, declaration.value, this.remtoes)

      groups[family.name] ??= []
      groups[family.name].push(directive)
      mandatory.delete(family.name)
    }

    const sets: DirectiveSet[] = []

    for (const family of mandatory)
      sets.push({
        family: this.families[family],
        directives: []
      })

    for (const [family, directives] of Object.entries(groups))
      sets.push({
        family: this.families[family],
        directives
      })

    return new Directives(sets)
  }
}

export const shortcuts: RTD.syntax.Shortcuts = new Map([
  ['anonymous', 'auth:anonymous'],
  ['id', 'auth:id'],
  ['role', 'auth:role'],
  ['rule', 'auth:rule'],
  ['incept', 'auth:incept']
])

export interface Family<TDirective = any, TExtension = any> {
  readonly name: string
  readonly mandatory: boolean

  create: (name: string, value: any, remotes: Remotes) => TDirective

  preflight: (directives: TDirective[],
    request: IncomingMessage & TExtension,
    parameters: RTD.Parameter[]) => Output | Promise<Output>

  settle?: (directives: TDirective[],
    request: IncomingMessage & TExtension,
    response: OutgoingMessage) => void | Promise<void>
}

interface DirectiveSet {
  family: Family
  directives: any[]
}

export type Input = IncomingMessage
export type Output = OutgoingMessage | null
