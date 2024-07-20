import { console } from 'openspan'
import { decode, encode } from '@toa.io/generic'
import { Logs } from './Logs'
import type { LogsOptions } from './Logs'
import type { Locator, extensions } from '@toa.io/core'
import type { Dependency, Variables } from '@toa.io/operations'
import type { Channel } from 'openspan'

export class Factory implements extensions.Factory {
  private readonly logsOptions: LogsOptions

  public constructor () {
    const globEnv = process.env[LOGS_PREFIX]
    const level = process.env.TOA_DEV === '1' ? 'debug' : 'info'

    this.logsOptions = globEnv === undefined ? { level } : decode(globEnv)
    this.logsOptions.level ??= level

    console.configure({ level: this.logsOptions.level })
  }

  public aspect (locator: Locator): extensions.Aspect[] {
    const logs = this.createLogs(locator)

    return [logs]
  }

  private createLogs (locator: Locator): extensions.Aspect {
    const overEnv = process.env[`${LOGS_PREFIX}_${locator.uppercase}`]
    const override = overEnv !== undefined ? decode(overEnv) : undefined

    const { level } = Object.assign({}, this.logsOptions, override)

    return new Logs(locator, { level })
  }
}

export function deployment (_: unknown, annotation: Annotation): Dependency {
  const variables: Variables = { global: [] }

  if (annotation?.logs !== undefined)
    addLogsVariables(annotation.logs, variables)

  return { variables }
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

interface Annotation {
  logs: LogsAnnotation & Record<string, LogsAnnotation>
}

interface LogsAnnotation {
  level: Channel
}

const ENV_PREFIX = 'TOA_TELEMETRY'
const LOGS_PREFIX = ENV_PREFIX + '_LOGS'
export const ID = 'telemetry'
