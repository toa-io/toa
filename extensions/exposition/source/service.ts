import {
  console,
  metrics,
  traces,
  type LevelName,
  type MetricsOptions,
  type TracesOptions
} from 'openspan'
import { Gateway } from './Gateway.ts'
import { Remotes } from './Remotes.ts'
import { Tree } from './RTD/index.ts'
import { EndpointsFactory } from './Endpoint.ts'
import { families, interceptors } from './directives/index.ts'
import { DirectivesFactory } from './Directive.ts'
import { Composition } from './Composition.ts'
import * as root from './root.ts'
import { ATOM_GROUP, CHANNEL } from '@toa.io/definitions/extensions.exposition'
import { Interception } from './Interception.ts'
import { Dispatcher } from './RPC/index.ts'
import { Server as Model } from './MCP/index.ts'
import * as http from './HTTP/index.ts'
import { environment } from '@toa.io/generic'
import type { Broadcast } from './Gateway.ts'
import type { Connector } from '@toa.io/core'
import type { Host } from './Factory.ts'

/**
 * The gateway. A composition loads this extension for its tenants alone, so what the
 * gateway is made of is reached from here and nowhere the factory imports.
 */
export async function service(host: Host): Promise<Connector | null> {
  const properties = environment.get('TOA_EXPOSITION_PROPERTIES')

  if (properties === undefined) throw new Error('TOA_EXPOSITION_PROPERTIES is undefined')

  configureLogs()

  const options = JSON.parse(properties) as http.Options
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
const METRICS_ENV = 'TOA_TELEMETRY_METRICS'

function configureLogs(): void {
  const globEnv = environment.get(LOGS_PREFIX)
  const level: LevelName = environment.get('TOA_DEV') === '1' ? 'trace' : 'info'
  const options =
    globEnv === undefined ? { level } : (JSON.parse(globEnv) as { level?: LevelName })

  console.configure({ level: options.level ?? level })

  const tracesEnv = environment.get(TRACES_ENV)
  const tracing =
    tracesEnv === undefined ? development() : (JSON.parse(tracesEnv) as TracesOptions)

  // `openspan` is not Toa's and reads the environment, which no longer holds the context by
  // the time the exporter is made — so the service is named here
  if (tracing.exporters?.otlp !== undefined)
    tracing.exporters.otlp.service ??= environment.get('TOA_CONTEXT')

  traces(tracing)
  metrics(measurements())
}

/**
 * The gateway measures what it serves, and what tells two products apart in one backend is the
 * resource rather than the metric name.
 */
function measurements(): MetricsOptions {
  const env = environment.get(METRICS_ENV)

  if (env === undefined)
    return environment.get('TOA_DEV') === '1' ? { exporters: { console: {} } } : {}

  const options = JSON.parse(env) as MetricsOptions

  if (options.exporters?.otlp !== undefined) {
    const resource = (options.exporters.otlp.resource ??= {})

    resource['service.name'] ??= 'exposition'
    resource['service.namespace'] ??= environment.get('TOA_CONTEXT')
    resource['deployment.environment.name'] ??= environment.get('TOA_ENV')
  }

  return options
}

/**
 * Tracing and metrics are off unless configured. The console exporter is a local development
 * mechanism, so it is turned on for `toa dev` and for a boot trace the CLI has already
 * asked for (`runtime/boot/src/span.js`), and nowhere else — a deployment that wants
 * traces annotates `telemetry.traces.exporters`.
 *
 * The gateway boots without the telemetry extension, hence the copy of
 * `extensions/telemetry/source/extension.ts`.
 */
function development(): TracesOptions {
  const local =
    environment.get('TOA_DEV') === '1' || environment.get('TOA_BOOT_TRACE') === '1'

  return local ? { exporters: { console: {} } } : {}
}
