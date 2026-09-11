import { console, traces } from 'openspan'
import { environment } from '@toa.io/generic'
import { LOGS_PREFIX, TRACES_ENV } from '@toa.io/definitions/extensions.telemetry'
import { Logs } from './Logs.ts'
import { Span } from './Span.ts'
import { Ready } from './Ready.ts'
import type { LogsOptions } from './Logs.ts'
import type { Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import type { TracesOptions } from 'openspan'

type Resident = extensions.Resident

export class Factory implements extensions.Factory {
  private readonly logsOptions: LogsOptions
  private readonly ready: Ready | null

  public constructor() {
    const globEnv = environment.get(LOGS_PREFIX)
    const level = environment.get('TOA_DEV') === '1' ? 'trace' : 'info'

    this.logsOptions = globEnv === undefined ? { level } : JSON.parse(globEnv)
    this.logsOptions.level ??= level

    console.configure({ level: this.logsOptions.level })

    const tracesEnv = environment.get(TRACES_ENV)
    const options =
      tracesEnv === undefined ? development() : (JSON.parse(tracesEnv) as TracesOptions)

    // `openspan` is not Toa's and reads the environment, which no longer holds the context by
    // the time the exporter is made — so the service is named here
    if (options.exporters?.otlp !== undefined)
      options.exporters.otlp.service ??= environment.get('TOA_CONTEXT')

    traces(options)

    this.ready = Ready.create()
  }

  public aspect(locator: Locator): extensions.Aspect[] {
    const logs = this.createLogs(locator)
    const span = new Span(locator)

    return [logs, span]
  }

  /**
   * The probe answers for the process, so it is the process it belongs to — and not whichever
   * composition happens to be nearest, which in a service is the one nested inside it. That is
   * why the explorer reported ready when the components it hosts connected rather than when
   * the explorer did, and why the gateway carries a probe of its own to work around it.
   *
   * It binds before the process is built and answers `503` until `complete()`, which is the
   * phase the `connect` this used to patch was standing in for.
   */
  public resident(): Resident | null {
    return this.ready
  }

  private createLogs(locator: Locator): extensions.Aspect {
    const overEnv = environment.get(`${LOGS_PREFIX}_${locator.uppercase}`)
    const override = overEnv !== undefined ? JSON.parse(overEnv) : undefined

    const { level } = Object.assign({}, this.logsOptions, override)

    return new Logs(locator, { level })
  }
}

/**
 * Tracing is off unless it is configured. The console exporter is a local development
 * mechanism, so it is turned on for `toa dev` and for a boot trace the CLI has already
 * asked for (`runtime/boot/src/span.js`), and nowhere else — a deployment that wants
 * traces annotates `telemetry.traces.exporters`.
 *
 * `extensions/exposition/source/Factory.ts` says the same thing for the gateway process,
 * which boots without this extension.
 */
function development(): TracesOptions {
  const local =
    environment.get('TOA_DEV') === '1' || environment.get('TOA_BOOT_TRACE') === '1'

  return local ? { exporters: { console: {} } } : {}
}
