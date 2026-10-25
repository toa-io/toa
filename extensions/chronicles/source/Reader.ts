import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Connector, Locator, exceptions } from '@toa.io/core'
import { ENCOUNTERS, NAMESPACE, view } from '@toa.io/definitions/extensions.chronicles'
import { Refusal } from './Provider.ts'
import type { Definition, Field, Provider, Result, View } from './Provider.ts'
import type { Remote } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import type { Contract, Settings } from '@toa.io/definitions/extensions.chronicles'

/**
 * What `chronicles.queries` reads the log through: queries in the provider's dialect, views made
 * from a statement the provider let a query run, and what the log holds — how it is read, what the
 * components declare, what the context documents of encounters, and what the store has written.
 */
export class Reader extends Connector {
  public readonly name = 'chronicles'

  private readonly host: extensions.Host
  private readonly provider: () => Provider
  private readonly settings: () => Settings
  private encounters?: Promise<Remote>

  public constructor(
    host: extensions.Host,
    provider: () => Provider,
    settings: () => Settings
  ) {
    super()

    this.host = host
    this.provider = provider
    this.settings = settings
  }

  public async invoke(method: string, ...args: any[]): Promise<unknown> {
    switch (method) {
      case 'describe':
        return await this.describe()
      case 'query':
        return await this.query(args[0])
      case 'define':
        return await this.define(args[0])
      case 'drop':
        return await this.drop(args[0])
      default:
        throw new exceptions.MisuseException(`Chronicles have no '${method}'`)
    }
  }

  private async describe(): Promise<Description> {
    const provider = this.provider()
    const settings = this.settings()

    const [written, kept, sent, views, documented] = await Promise.all([
      provider.labels(),
      provider.states(),
      provider.encounters(),
      provider.views(),
      this.documented(settings)
    ])

    const declared: Record<string, Contract> = { ...settings.events, ...settings.facts }
    const stated = Object.fromEntries(
      Object.entries(settings.states).map(([label, contract]) => [
        component(label),
        contract
      ])
    )

    const labels = merge(
      written.map(({ label, ...stats }) => [label, stats]),
      Object.keys(declared)
    ).map(([label, stats]) => ({
      label,
      ...about(declared[label], label, provider),
      ...(stats ?? { rows: 0 })
    }))

    const states = merge(
      kept.map(({ component, ...stats }) => [component, stats]),
      Object.keys(stated)
    ).map(([component, stats]) => ({
      component,
      ...about(stated[component], component, provider),
      ...(stats ?? { entities: 0 })
    }))

    const encounters = merge(
      sent.map(({ name, ...stats }) => [name, stats]),
      Object.keys(documented)
    ).map(([name, stats]) => {
      const { description, fields: told = {} } = documented[name] ?? {}
      const fields = (stats?.fields ?? []).map((field) =>
        told[field.path] === undefined
          ? field
          : { ...field, description: told[field.path] }
      )

      return {
        name,
        ...(description === undefined ? {} : { description }),
        ...(stats ?? { rows: 0 }),
        fields
      }
    })

    return { guide: `${GUIDE}\n${provider.guide}`, labels, states, encounters, views }
  }

  private async query(sql: string): Promise<Result | Error> {
    return await refused(async () => await this.provider().query(statement(sql)))
  }

  private async define(definition: Definition): Promise<Error | undefined> {
    const provider = this.provider()
    const { name } = definition

    if (provider.tables.includes(name) || this.declared().has(name))
      return new Error('RESERVED', {
        cause: {
          message: `'${name}' is a table of the log, or the view of what is declared`
        }
      })

    const select = statement(definition.sql)
    const invalid = await refused(async () => await provider.validate(select))

    if (invalid instanceof Error) return invalid

    const views = await provider.views()

    if (!views.some((view) => view.name === name) && views.length >= MAX_VIEWS)
      return new Error('EXHAUSTED', {
        cause: { message: `A context has at most ${MAX_VIEWS} views` }
      })

    const defined = await refused(
      async () => await provider.define({ ...definition, sql: select })
    )

    return defined instanceof Error ? defined : undefined
  }

  private async drop(name: string): Promise<Error | undefined> {
    const provider = this.provider()
    const views = await provider.views()

    if (!views.some((view) => view.name === name)) return new Error('NOT_FOUND')

    await provider.drop(name)

    return undefined
  }

  /** The names of the views of what is declared. */
  private declared(): Set<string> {
    const settings = this.settings()

    return new Set([
      ...Object.keys(settings.events).map(view),
      ...Object.keys(settings.facts).map(view),
      ...Object.keys(settings.states).map((label) => view(component(label)))
    ])
  }

  /**
   * What the configuration of `chronicles.encounters` documents, asked of that component, which is
   * in this service where the context serves encounters. Found on the first ask and not before: an
   * aspect is made ahead of the components of its composition.
   */
  private async documented(settings: Settings): Promise<Documented> {
    if (!settings.encounters) return {}

    this.encounters ??= (async () => {
      const remote = await this.host.remote(LOCATOR, SOURCE)

      this.depends(remote)
      await remote.connect()

      return remote
    })().catch((error: unknown) => {
      this.encounters = undefined

      throw error
    })

    const remote = await this.encounters

    return (await remote.invoke('describe', {})) as Documented
  }
}

/**
 * Of what was written and what is declared, by key, in order: a key declared and not yet written
 * has no statistics, and one written and no longer declared has nothing else.
 */
function merge<T>(
  written: Array<[string, T]>,
  declared: string[]
): Array<[string, T | undefined]> {
  const by = new Map(written)
  const keys = [...new Set([...by.keys(), ...declared])].sort()

  return keys.map((key) => [key, by.get(key)])
}

/** What a declaration says of a label or a state: its meaning, its view, its fields. */
function about(
  contract: Contract | undefined,
  of: string,
  provider: Provider
): { description?: string; view?: string; fields?: Field[] } {
  if (contract === undefined) return {}

  return {
    description: contract.description,
    view: view(of),
    fields: provider.fields(contract.properties)
  }
}

function component(label: string): string {
  return label.slice(0, label.lastIndexOf('.'))
}

/** One statement: a trailing semicolon is an agent's habit. */
function statement(sql: string): string {
  return sql.trim().replace(/;+$/, '').trim()
}

async function refused<T>(fn: () => Promise<T>): Promise<T | Error> {
  try {
    return await fn()
  } catch (exception) {
    if (exception instanceof Refusal)
      return new Error('REFUSED', { cause: { message: exception.message } })

    throw exception
  }
}

type Documented = Record<
  string,
  { description?: string; fields?: Record<string, string> }
>

interface Description {
  /** how to read the log, and how its store is read */
  guide: string
  labels: object[]
  states: object[]
  encounters: object[]
  views: View[]
}

const LOCATOR = new Locator(ENCOUNTERS, NAMESPACE)
const SOURCE = { service: 'chronicles' }
const MAX_VIEWS = 50
const GUIDE = readFileSync(resolve(import.meta.dirname, '../guides/log.md'), 'utf8')
