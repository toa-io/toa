import type { Context, OutgoingMessage } from './HTTP'
import type { Remotes } from './Remotes'
import type { Output } from './io'
import type * as RTD from './RTD'

export class Directives implements RTD.Directives<Directives> {
  private readonly sets: DirectiveSet[]

  public constructor (sets: DirectiveSet[]) {
    this.sets = sets
  }

  public async preflight (context: Context, parameters: RTD.Parameter[]): Promise<Output> {
    for (const set of this.sets) {
      if (set.family.preflight === undefined)
        continue

      const output = await set.family.preflight(set.directives, context, parameters)

      if (output !== null) {
        await this.settle(context, output)

        return output
      }
    }

    return null
  }

  public async settle (context: Context, response: OutgoingMessage): Promise<void> {
    for (const set of this.sets)
      if (set.family.settle !== undefined)
        await set.family.settle(set.directives, context, response)
  }

  public merge (directives: Directives): void {
    this.sets.push(...directives.sets)
  }
}

export class DirectivesFactory implements RTD.DirectivesFactory<Directives> {
  private readonly remotes: Remotes
  private readonly families: Record<string, Family> = {}
  private readonly mandatory: string[] = []

  public constructor (families: Family[], remotes: Remotes) {
    for (const family of families) {
      this.families[family.name] = family

      if (family.mandatory)
        this.mandatory.push(family.name)
    }

    this.remotes = remotes
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

      const directive = family.create(declaration.name, declaration.value, this.remotes)

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

  // produce: (declarations: RTD.syntax.Directive[], remotes: Remotes) => TDirective[]

  create: (name: string, value: any, remotes: Remotes) => TDirective

  preflight?: (directives: TDirective[],
    request: Context & TExtension,
    parameters: RTD.Parameter[]) => Output | Promise<Output>

  settle?: (directives: TDirective[],
    request: Context & TExtension,
    response: OutgoingMessage) => void | Promise<void>
}

interface DirectiveSet {
  family: Family
  directives: any[]
}
