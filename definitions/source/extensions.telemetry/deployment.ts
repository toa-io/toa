import assert from 'node:assert'
import { LOGS_PREFIX, READY_ENV, TRACES_ENV } from './const.js'
import { DEFAULT_ANNOTATION, normalizeAnnotation, type ReadyAnnotation } from './ready.js'
import type { Dependency, Probe, Variables } from '@toa.io/operations'
import type { ExportersConfig, LevelName } from 'openspan'

export function deployment(_: unknown, annotation?: Annotation): Dependency {
  const variables: Variables = { global: [] }

  if (annotation?.logs !== undefined) addLogsVariables(annotation.logs, variables)

  if (annotation?.traces !== undefined) addTracesVariables(annotation.traces, variables)

  const ready = normalizeAnnotation(annotation?.ready)

  if (ready === false) {
    variables.global.push({ name: READY_ENV, value: JSON.stringify(false) })

    return { variables, probe: false }
  }

  variables.global.push({ name: READY_ENV, value: JSON.stringify(ready) })

  const probe: Probe = {
    path: ready.path ?? DEFAULT_ANNOTATION.path,
    port: ready.port ?? DEFAULT_ANNOTATION.port
  }

  return { variables, probe }
}

function addLogsVariables(annotation: LogsAnnotation, variables: Variables): void {
  const { level, ...components } = annotation
  const global = { level }

  if (level !== undefined)
    variables.global.push({ name: LOGS_PREFIX, value: JSON.stringify(global) })

  for (const [id, override] of Object.entries(components)) {
    const [namespace, name] = id.split('.')
    const value = Object.assign({}, global, override)

    variables.global.push({
      name: `${LOGS_PREFIX}_${namespace.toUpperCase()}_${name.toUpperCase()}`,
      value: JSON.stringify(value)
    })
  }
}

function addTracesVariables(annotation: TracesAnnotation, variables: Variables): void {
  const { sample, rate, exporters } = annotation

  if (sample !== undefined)
    assert.ok(
      typeof sample === 'number' && sample >= 0 && sample <= 1,
      'telemetry.traces.sample must be a number within [0, 1]'
    )

  if (rate !== undefined)
    assert.ok(
      typeof rate === 'number' && rate > 0,
      'telemetry.traces.rate must be a positive number'
    )

  if (exporters?.otlp !== undefined)
    assert.ok(
      typeof exporters.otlp.endpoint === 'string',
      'telemetry.traces.exporters.otlp.endpoint is required'
    )

  variables.global.push({
    name: TRACES_ENV,
    value: JSON.stringify({ sample, rate, exporters })
  })
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
  exporters?: ExportersConfig
}
