import assert from 'node:assert'
import { createHash } from 'node:crypto'
import { console, traces, type LevelName, type TracesOptions } from 'openspan'
import { decode } from '@toa.io/generic'
import { Tenant } from './Tenant'
import { Gateway } from './Gateway'
import { Remotes } from './Remotes'
import { Tree } from './RTD'
import { EndpointsFactory } from './Endpoint'
import { families, interceptors } from './directives'
import { DirectivesFactory } from './Directive'
import { Composition } from './Composition'
import * as root from './root'
import { Interception } from './Interception'
import * as http from './HTTP'
import type { Branch } from './Branch'
import type { syntax } from './RTD'
import type { Broadcast } from './Gateway'
import type { Connector, Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    this.boot = boot
  }

  public tenant (locator: Locator, node: syntax.Node): Connector {
    const broadcast: Broadcast = this.boot.bindings.broadcast(CHANNEL, locator.id)
    const hash = createHash('sha256').update(JSON.stringify(node)).digest('hex')

    const branch: Branch = {
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

    const options = decode<http.Options>(process.env.TOA_EXPOSITION_PROPERTIES)
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
  const options = globEnv === undefined ? { level } : decode<{ level?: LevelName }>(globEnv)

  console.configure({ level: options.level ?? level })

  const tracesEnv = process.env[TRACES_ENV]

  traces(tracesEnv === undefined ? development() : decode<TracesOptions>(tracesEnv))
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
