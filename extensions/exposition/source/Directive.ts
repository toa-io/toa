import { console, type SpanOptions } from 'openspan'
import type { Context, OutgoingMessage, Options } from './HTTP/index.js'
import type { Remotes } from './Remotes.js'
import type { Host } from './Factory.js'
import type { Output } from './io.js'
import type { Introspection } from './Introspection.js'
import type * as RTD from './RTD/index.js'

export class Directives implements RTD.Directives {
  private readonly sets: RTD.DirectiveSet[]

  /** the span of a stage depends only on the set, so it is built once per route */
  private readonly spans: Spans[]

  public constructor (sets: RTD.DirectiveSet[]) {
    this.sets = sets
    this.spans = sets.map((set) => ({
      precall: options(set, 'precall'),
      settle: options(set, 'settle'),
      explain: options(set, 'explain')
    }))
  }

  public declared<T> (family: string): T[] | undefined {
    return this.sets.find((set) => set.family.name === family)?.directives as T[] | undefined
  }

  public async precall (context: Context, parameters: RTD.Parameter[]): Promise<Output> {
    let output = null

    for (let i = 0; i < this.sets.length; i++) {
      const set = this.sets[i]

      if (set.family.precall === undefined)
        continue

      const out = await console.span(this.spans[i].precall,
        async () => await set.family.precall!(set.directives, context, parameters))

      if (out === null)
        continue

      if (output !== null)
        throw new Error('Multiple precall directives responded')
      else
        output = out
    }

    return output
  }

  /**
   * What the method says about itself, as its directives leave it. Each family is given
   * what the one before it returned, and the first to refuse ends it: a method this caller
   * cannot reach is not described at all.
   */
  public async explain (context: Context,
    introspection: Introspection): Promise<Introspection | null> {
    let described: Introspection = introspection

    for (let i = 0; i < this.sets.length; i++) {
      const set = this.sets[i]

      if (set.family.explain === undefined)
        continue

      const next = await console.span(this.spans[i].explain,
        async () => await set.family.explain!(set.directives, context, described))

      if (next === null)
        return null

      described = next
    }

    return described
  }

  public async settle (context: Context, response: OutgoingMessage): Promise<void> {
    for (let i = 0; i < this.sets.length; i++) {
      const set = this.sets[i]

      if (set.family.settle !== undefined)
        await console.span(this.spans[i].settle,
          async () => await set.family.settle!(set.directives, context, response))
    }
  }

  public dispose (): void {
    for (const set of this.sets)
      set.family.dispose?.(set.directives)
  }
}

export class DirectivesFactory implements RTD.DirectiveFactory {
  private readonly remotes: Remotes
  private readonly families: Record<string, RTD.DirectiveFamily> = {}
  private readonly mandatory: string[] = []
  private readonly instances: Directives[] = []

  /** The request-scoped stages, in registration order, with the spans they run in. */
  private readonly stages: Stage[] = []

  // eslint-disable-next-line max-params
  public constructor (families: RTD.DirectiveFamily[], remotes: Remotes, host: Host,
    options: Options) {
    for (const family of families) {
      family.mount?.(host, options)
      this.families[family.name] = family

      if (family.mandatory)
        this.mandatory.push(family.name)

      this.stages.push({
        family,
        preflight: { name: `${family.name} preflight` },
        depart: { name: `${family.name} depart` }
      })
    }

    this.remotes = remotes
  }

  /**
   * Request-scoped, before anything is routed, so no directives are passed: a family
   * answers here only for what it does on its own behalf.
   */
  public async preflight (context: Context): Promise<void> {
    for (const stage of this.stages)
      if (stage.family.preflight !== undefined)
        await console.span(stage.preflight,
          async () => { await stage.family.preflight!(context) })
  }

  /** Request-scoped, on the message going back. */
  public async depart (context: Context, response: OutgoingMessage): Promise<void> {
    for (const stage of this.stages)
      if (stage.family.depart !== undefined)
        await console.span(stage.depart,
          async () => { await stage.family.depart!(context, response) })
  }

  public create (declarations: RTD.syntax.Directive[], route: string = ''): Directives {
    const groups: Record<string, any> = {}
    const mandatory = new Set(this.mandatory)

    const names: Record<string, string[]> = {}

    for (const declaration of declarations) {
      const family = this.families[declaration.family]

      if (family === undefined)
        throw new Error(`Directive family '${declaration.family}' is not found`)

      const directive = family.create(declaration.name, declaration.value, this.remotes, route)

      groups[family.name] ??= []
      groups[family.name].push(directive)
      names[family.name] ??= []
      names[family.name].push(`${declaration.family}:${declaration.name}`)
      mandatory.delete(family.name)
    }

    const sets: RTD.DirectiveSet[] = []

    for (const family of mandatory)
      sets.push({
        family: this.families[family],
        directives: [],
        names: []
      })

    for (const [family, directives] of Object.entries(groups))
      sets.push({
        family: this.families[family],
        directives,
        names: names[family]
      })

    // Mandatory families run in the order they are registered in, not in the order a
    // manifest happens to mention them: `auth` must resolve the identity before `io`
    // can key a quota on it, and a request it denies should not reach `io` at all.
    // The rest keep the order they were declared in, the sort being stable.
    sets.sort((a, b) => this.rank(a.family.name) - this.rank(b.family.name))

    // whatever order a family needs among its own directives is fixed here, not per request
    for (const set of sets)
      set.family.arrange?.(set.directives)

    const directives = new Directives(sets)

    this.instances.push(directives)

    return directives
  }

  public dispose (): void {
    for (const directives of this.instances)
      directives.dispose()
  }

  /** Mandatory families first, in their own order; everything else keeps its own. */
  private rank (family: string): number {
    const index = this.mandatory.indexOf(family)

    return index === -1 ? this.mandatory.length : index
  }
}

function options (set: RTD.DirectiveSet, stage: 'precall' | 'settle' | 'explain'): SpanOptions {
  const options: SpanOptions = { name: `${set.family.name} ${stage}` }

  if (set.names !== undefined && set.names.length > 0)
    options.attributes = { directives: Array.from(new Set(set.names)).join(' ') }

  return options
}

interface Spans {
  precall: SpanOptions
  settle: SpanOptions
  explain: SpanOptions
}

interface Stage {
  family: RTD.DirectiveFamily
  preflight: SpanOptions
  depart: SpanOptions
}

export const shortcuts: RTD.syntax.Shortcuts = new Map([
  ['anonymous', 'auth:anonymous'],
  ['anyone', 'auth:anyone'],
  ['id', 'auth:id'],
  ['role', 'auth:role'],
  ['rule', 'auth:rule'],
  ['incept', 'auth:incept'],
  ['input', 'io:input'],
  ['output', 'io:output'],
  ['languages', 'map:languages']
])
