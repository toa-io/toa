import assert from 'node:assert'
import { console, sampling } from 'openspan'
import { decode, encode } from '@toa.io/generic'
import { Logs } from './Logs'
import { Span } from './Span'
import {
  DEFAULT_ANNOTATION,
  normalizeAnnotation,
  Ready,
  READY_ENV,
  type ReadyAnnotation
} from './Ready'
import type { LogsOptions } from './Logs'
import type { Connector, Locator, extensions } from '@toa.io/core'
import type { Dependency, Probe, Variables } from '@toa.io/operations'
import type { LevelName } from 'openspan'

export class Factory implements extensions.Factory {
  private readonly logsOptions: LogsOptions
  private readonly ready: Ready | null

  public constructor () {
    const globEnv = process.env[LOGS_PREFIX]
    const level = process.env.TOA_DEV === '1' ? 'trace' : 'info'

    this.logsOptions = globEnv === undefined ? { level } : decode(globEnv)
    this.logsOptions.level ??= level

    console.configure({ level: this.logsOptions.level })

    const tracesEnv = process.env[TRACES_ENV]

    sampling(tracesEnv === undefined ? {} : decode(tracesEnv))

    this.ready = Ready.create()
  }

  public aspect (locator: Locator): extensions.Aspect[] {
    const logs = this.createLogs(locator)
    const span = new Span(locator)

    return [logs, span]
  }

  public manage (composition: Connector): Connector {
    if (this.ready === null)
      return composition

    const ready = this.ready
    const connect = composition.connect.bind(composition)
    const disconnect = composition.disconnect.bind(composition)

    composition.connect = async () => {
      await ready.listen()
      await connect()
      await ready.complete()
    }

    composition.disconnect = async (interrupt?: boolean) => {
      await ready.disconnect(interrupt)
      await disconnect(interrupt)
    }

    return composition
  }

  private createLogs (locator: Locator): extensions.Aspect {
    const overEnv = process.env[`${LOGS_PREFIX}_${locator.uppercase}`]
    const override = overEnv !== undefined ? decode(overEnv) : undefined

    const { level } = Object.assign({}, this.logsOptions, override)

    return new Logs(locator, { level })
  }
}

export function deployment (_: unknown, annotation?: Annotation): Dependency {
  const variables: Variables = { global: [] }

  if (annotation?.logs !== undefined)
    addLogsVariables(annotation.logs, variables)

  if (annotation?.traces !== undefined)
    addTracesVariables(annotation.traces, variables)

  const ready = normalizeAnnotation(annotation?.ready)

  if (ready === false) {
    variables.global.push({ name: READY_ENV, value: encode(false) })

    return { variables, probe: false }
  }

  variables.global.push({ name: READY_ENV, value: encode(ready) })

  const probe: Probe = {
    path: ready.path ?? DEFAULT_ANNOTATION.path,
    port: ready.port ?? DEFAULT_ANNOTATION.port,
    delay: ready.delay ?? DEFAULT_ANNOTATION.delay
  }

  return { variables, probe }
}

function addLogsVariables (annotation: LogsAnnotation, variables: Variables): void {
  const { level, ...components } = annotation
  const global = { level }

  if (level !== undefined)
    variables.global.push({ name: LOGS_PREFIX, value: encode(global) })

  for (const [id, override] of Object.entries(components)) {
    const [namespace, name] = id.split('.')
    const value = Object.assign({}, global, override)

    variables.global.push({
      name: `${LOGS_PREFIX}_${namespace.toUpperCase()}_${name.toUpperCase()}`,
      value: encode(value)
    })
  }
}

function addTracesVariables (annotation: TracesAnnotation, variables: Variables): void {
  const { sample, rate } = annotation

  if (sample !== undefined)
    assert.ok(typeof sample === 'number' && sample >= 0 && sample <= 1,
      'telemetry.traces.sample must be a number within [0, 1]')

  if (rate !== undefined)
    assert.ok(typeof rate === 'number' && rate > 0,
      'telemetry.traces.rate must be a positive number')

  variables.global.push({ name: TRACES_ENV, value: encode({ sample, rate }) })
}

interface Annotation {
  logs?: LogsAnnotation & Record<string, LogsAnnotation>
  traces?: TracesAnnotation
  ready?: ReadyAnnotation
}

interface LogsAnnotation {
  level: LevelName
}

interface TracesAnnotation {
  sample?: number
  rate?: number
}

const ENV_PREFIX = 'TOA_TELEMETRY'
const LOGS_PREFIX = ENV_PREFIX + '_LOGS'
const TRACES_ENV = ENV_PREFIX + '_TRACES'
export const ID = 'telemetry'
