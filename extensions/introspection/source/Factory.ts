import { Connector } from '@toa.io/core'
import { environment } from '@toa.io/definitions/extensions.introspection'
import { NAMESPACE, uiPort } from '@toa.io/definitions/extensions.introspection'
import { describe } from './describe.ts'
import { Reporter } from './Reporter.ts'
import { Tenant } from './Tenant.ts'
import { Halt } from './Halt.ts'
import { Composition } from './Composition.ts'
import { Explorer } from './Explorer.ts'
import { UI } from './UI.ts'
import type { Declaration, Options } from '@toa.io/definitions/extensions.introspection'
import type { Origin, Target } from './model.ts'
import type { Manifest } from '@toa.io/norm'
import type { Component, Locator } from '@toa.io/core'
import type { Request, extensions } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  private readonly host: Host
  private readonly options: Options | null
  private readonly mapped: Record<string, boolean> = {}
  private reporter: Reporter | null = null

  public constructor(host: Host) {
    this.host = host
    this.options = environment()
  }

  public tenant(
    locator: Locator,
    decl: Declaration | null,
    manifest: Manifest
  ): Connector {
    const mapped = this.options !== null && decl !== false

    this.mapped[locator.id] = mapped

    if (!mapped || locator.namespace === NAMESPACE) return new Connector()

    return new Tenant(this.collector(), describe(manifest))
  }

  public component(component: Component): Component {
    const locator = component.locator

    if (!this.observed(locator)) return component

    const reporter = this.collector()
    const invoke = component.invoke.bind(component)

    component.invoke = async (endpoint: string, request: Request): Promise<any> => {
      try {
        return await invoke(endpoint, request)
      } finally {
        // a call that failed is still a connection between two components
        const src: Origin = origin(request?.source)
        const dst: Target = {
          namespace: locator.namespace!,
          component: locator.name,
          operation: endpoint
        }

        reporter.observe({ src, dst })
      }
    }

    component.depends(reporter)

    return component
  }

  /**
   * What this extension keeps in every process of a deployment, whatever that process runs:
   * the ear a halt arrives at. Behind a gate, so that a halted process holds nothing — the
   * subscription included — and hears the next signal only once it is back.
   */
  public resident(host: Host): Connector | null {
    if (this.options?.halt !== true) return null

    return host.gate(async () => new Halt(host, this.options!))
  }

  // a halt takes the whole of it, the UI with it: a map nobody is reporting to is stale
  public service(): Connector | null {
    if (this.options === null) return null

    return this.host.gate(async () => {
      const composition = new Composition(this.host)
      const explorer = new Explorer()

      explorer.depends(composition)

      if (this.options?.ui === true) explorer.depends(new UI(uiPort()))

      return explorer
    })
  }

  /**
   * `tenant()` runs before any component is created, so what it decided is warm.
   * A component booted on its own (without a composition) falls back to the
   * environment: it is on the map wherever collection is configured at all.
   */
  private observed(locator: Locator): boolean {
    if (locator.namespace === NAMESPACE) return false

    return this.mapped[locator.id] ?? this.options !== null
  }

  /**
   * One collector per process — and per build of its tree. A reporter that went with a tree
   * that has been taken down holds remotes that are gone: it would answer that it is ready,
   * dispatch into nothing, and say so at `debug` alone.
   */
  private collector(): Reporter {
    if (this.reporter === null || this.reporter.disposed)
      this.reporter = new Reporter(this.host, this.options!)

    return this.reporter
  }
}

const UNKNOWN = { service: 'unknown' } as const

/**
 * `source` crosses the wire, and what it names is stored as an edge of the map — so what is
 * read off it is the keys this release knows, and never whatever a peer put beside them.
 */
function origin(source: Origin | undefined): Origin {
  if (source === undefined) return UNKNOWN

  if ('service' in source) return { service: source.service }

  return 'event' in source
    ? { namespace: source.namespace, component: source.component, event: source.event }
    : {
        namespace: source.namespace,
        component: source.component,
        operation: source.operation
      }
}

export type Host = extensions.Host
