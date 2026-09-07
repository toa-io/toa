import assert from 'node:assert'
import { console, traces, type LevelName, type TracesOptions } from 'openspan'
import { Gateway } from './Gateway.js'
import { Remotes } from './Remotes.js'
import { Tree } from './RTD/index.js'
import { EndpointsFactory } from './Endpoint.js'
import { families, interceptors } from './directives/index.js'
import { DirectivesFactory } from './Directive.js'
import { Composition } from './Composition.js'
import * as root from './root.js'
import { ATOM_GROUP, CHANNEL } from './const.js'
import { Interception } from './Interception.js'
import { Dispatcher } from './RPC/index.js'
import { Server as Model } from './MCP/index.js'
import * as http from './HTTP/index.js'
import type { Broadcast } from './Gateway.js'
import type { Connector } from '@toa.io/core'
import type { Host } from './Factory.js'

/**
 * The gateway. A composition loads this extension for its tenants alone, so what the
 * gateway is made of is reached from here and nowhere the factory imports.
 */
export async function service(host: Host): Promise<Connector | null> {
  assert.ok(
    process.env.TOA_EXPOSITION_PROPERTIES,
    'TOA_EXPOSITION_PROPERTIES is undefined'
  )

  configureLogs()

  const options = JSON.parse(process.env.TOA_EXPOSITION_PROPERTIES) as http.Options
  const broadcast: Broadcast = await host.broadcast(CHANNEL)
  const server = http.Server.create({ ...options })
  const remotes = new Remotes(host)
  const node = root.resolve()
  const methods = new EndpointsFactory(remotes)
  const directives = new DirectivesFactory(families, remotes, host, options)
  const interception = new Interception(interceptors, options)
  const tree = new Tree(node, methods, directives)

  const composition = new Composition(host)
  const dispatcher = options.rpc === undefined ? null : new Dispatcher(options.rpc)
  const mcp = options.mcp === undefined ? null : new Model(options.mcp, tree)
  const gateway = new Gateway(broadcast, tree, interception, directives, dispatcher, mcp)

  gateway.depends(remotes)
  gateway.depends(composition)
  // what the directives meter through; one atom per process, connected once
  gateway.depends(host.atom(ATOM_GROUP))

  server.attach(gateway.process.bind(gateway))
  server.depends(gateway)

  return server
}

const LOGS_PREFIX = 'TOA_TELEMETRY_LOGS'
const TRACES_ENV = 'TOA_TELEMETRY_TRACES'

function configureLogs(): void {
  const globEnv = process.env[LOGS_PREFIX]
  const level: LevelName = process.env.TOA_DEV === '1' ? 'trace' : 'info'
  const options =
    globEnv === undefined ? { level } : (JSON.parse(globEnv) as { level?: LevelName })

  console.configure({ level: options.level ?? level })

  const tracesEnv = process.env[TRACES_ENV]

  traces(
    tracesEnv === undefined ? development() : (JSON.parse(tracesEnv) as TracesOptions)
  )
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
function development(): TracesOptions {
  const local = process.env.TOA_DEV === '1' || process.env.TOA_BOOT_TRACE === '1'

  return local ? { exporters: { console: {} } } : {}
}
