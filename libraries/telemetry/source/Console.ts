import { format } from 'node:util'
import { formatters } from './formatters'
import type { Format } from './formatters'

export class Console {
  public readonly debug = this.channel('debug')
  public readonly info = this.channel('info')
  public readonly warn = this.channel('warn')
  public readonly error = this.channel('error')

  private readonly stdout
  private readonly stderr

  private readonly context?: object

  public constructor (options: Partial<Options> = {}) {
    options.streams ??= process

    this.stdout = options.streams.stdout
    this.stderr = options.streams.stderr
    this.context = options.context
  }

  private channel (channel: Channel): Method {
    const severity = channel.toUpperCase() as Severity

    return (template: string, ...values: unknown[]) => {
      let attributes: object | undefined

      const last = values[values.length - 1]

      if (typeof last === 'object' && last !== null) {
        attributes = last
        values.pop()
      }

      const entry: Entry = {
        time: new Date().toISOString(),
        severity,
        message: format(template, ...values)
      }

      if (attributes !== undefined)
        entry.attributes = attributes

      if (this.context !== undefined)
        entry.context = this.context

      const formatter = formatters[process.env.OPENSPAN_TERMINAL !== undefined ? 'terminal' : 'json']
      const buffer = formatter.format(entry)

      if (channel === 'error')
        this.stderr.write(buffer)
      else
        this.stdout.write(buffer)
    }
  }
}

export const console = new Console()

interface Options {
  format: Format
  streams: Streams
  context?: Record<string, unknown>
}

interface Streams {
  stdout: NodeJS.WriteStream
  stderr: NodeJS.WriteStream
}

export interface Entry {
  time: string
  severity: Severity
  message: string
  attributes?: object
  context?: object
}

type Channel = 'debug' | 'info' | 'warn' | 'error'
type Severity = Uppercase<Channel>
type Method = (template: string, ...values: unknown[]) => void
