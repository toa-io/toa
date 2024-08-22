import type { Context, OutgoingMessage } from './HTTP'
import type { Remotes } from './Remotes'
import type { Output } from './io'
import type * as RTD from './RTD'

export class Directives implements RTD.Directives {
  private readonly sets: RTD.DirectiveSet[]

  public constructor (sets: RTD.DirectiveSet[]) {
    this.sets = sets
  }

  public async preflight (context: Context, parameters: RTD.Parameter[]): Promise<Output> {
    for (const set of this.sets) {
      if (set.family.preflight === undefined)
        continue

      const output = await set.family.preflight(set.directives, context, parameters)

      if (output !== null)
        return output
    }

    return null
  }

  public async settle (context: Context, response: OutgoingMessage): Promise<void> {
    for (const set of this.sets)
      if (set.family.settle !== undefined)
        await set.family.settle(set.directives, context, response)
  }
}

export class DirectivesFactory implements RTD.DirectiveFactory {
  private readonly remotes: Remotes
  private readonly families: Record<string, RTD.DirectiveFamily> = {}
  private readonly mandatory: string[] = []

  public constructor (families: RTD.DirectiveFamily[], remotes: Remotes) {
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
        throw new Error(`Directive family '${declaration.family}' is not found`)

      const directive = family.create(declaration.name, declaration.value, this.remotes)

      groups[family.name] ??= []
      groups[family.name].push(directive)
      mandatory.delete(family.name)
    }

    const sets: RTD.DirectiveSet[] = []

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
  ['incept', 'auth:incept'],
  ['input', 'io:input'],
  ['output', 'io:output']
])
