import assert from 'node:assert'
import { createHash } from 'node:crypto'
import { console, traces, type LevelName, type TracesOptions } from 'openspan'
import { Tenant } from './Tenant.js'
import { Gateway } from './Gateway.js'
import { Remotes } from './Remotes.js'
import { Tree } from './RTD/index.js'
import { EndpointsFactory } from './Endpoint.js'
import { families, interceptors } from './directives/index.js'
import { DirectivesFactory } from './Directive.js'
import { Composition } from './Composition.js'
import * as root from './root.js'
import { Interception } from './Interception.js'
import * as http from './HTTP/index.js'
import type { Branch } from './Branch.js'
import type { syntax } from './RTD/index.js'
import type { Broadcast } from './Gateway.js'
import type { Connector, Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public tenant (locator: Locator, node: syntax.Node): Connector {
    const broadcast: Broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id)
    const hash = createHash('sha256').update(JSON.stringify(node)).digest('hex')

    // no timestamp: the tenant stamps each announcement with its own start time
    const branch: Omit<Branch, 'timestamp'> = {
      namespace: locator.namespace,
      component: locator.name,
      isolated: locator.namespace === 'identity',
      node,
      version: hash
    }

    return new Tenant(broadcast, branch)
  }

  public service (): Connector | null {
    assert.ok(process.env.TOA_EXPOSITION_PROPERTIES,
      'TOA_EXPOSITION_PROPERTIES is undefined')

    configureLogs()

    const options = JSON.parse(process.env.TOA_EXPOSITION_PROPERTIES) as http.Options
    const broadcast: Broadcast = this.boot.bindings.broadcast(CHANNEL)
    const server = http.Server.create({ ...options })
    const remotes = new Remotes(this.boot)
    const node = root.resolve()
    const methods = new EndpointsFactory(remotes)
    const directives = new DirectivesFactory(families, remotes)
    const interception = new Interception(interceptors)
    const tree = new Tree(node, methods, directives)

    const composition = new Composition(this.boot)
    const gateway = new Gateway(broadcast, tree, interception)

    gateway.depends(remotes)
    gateway.depends(composition)

    server.attach(gateway.process.bind(gateway))
    server.depends(gateway)

    return server
  }
}

const CHANNEL = 'exposition'
const LOGS_PREFIX = 'TOA_TELEMETRY_LOGS'
const TRACES_ENV = 'TOA_TELEMETRY_TRACES'

function configureLogs (): void {
  const globEnv = process.env[LOGS_PREFIX]
  const level: LevelName = process.env.TOA_DEV === '1' ? 'trace' : 'info'
  const options = globEnv === undefined ? { level } : JSON.parse(globEnv) as { level?: LevelName }

  console.configure({ level: options.level ?? level })

  const tracesEnv = process.env[TRACES_ENV]

  traces(tracesEnv === undefined ? development() : JSON.parse(tracesEnv) as TracesOptions)
}

/**
 * Tracing is off unless it is configured. The console exporter is a local development
 * mechanism, so it is turned on for `toa dev` and for a boot trace the CLI has already
 * asked for (`runtime/boot/src/span.js`), and nowhere else — a deployment that wants
 * traces annotates `telemetry.traces.exporters`.
 *
 * The gateway boots without the telemetry extension, hence the copy of
 * `extensions/telemetry/source/extension.ts`.
 */
function development (): TracesOptions {
  const local = process.env.TOA_DEV === '1' || process.env.TOA_BOOT_TRACE === '1'

  return local ? { exporters: { console: {} } } : {}
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type Bootloader = typeof import('@toa.io/boot')
