import { format } from 'node:util'
import { formatters } from './formatters'
import type { Format } from './formatters'

export class Console {
  public readonly log = this.channel('debug')
  public readonly debug = this.channel('debug')
  public readonly info = this.channel('info')
  public readonly warn = this.channel('warn')
  public readonly error = this.channel('error')

  private level: number = LEVELS.debug
  private formatter = formatters.json
  private stdout: NodeJS.WriteStream = process.stdout
  private stderr: NodeJS.WriteStream = process.stderr
  private context?: object

  public constructor (options: Options = {}) {
    this.configure(options)
  }

  public configure (options: Options = {}): void {
    if (options.level !== undefined)
      this.level = typeof options.level === 'string' ? LEVELS[options.level] : options.level

    if (options.format !== undefined)
      this.formatter = formatters[options.format]

    if (options.streams !== undefined) {
      this.stdout = options.streams.stdout
      this.stderr = options.streams.stderr
    }

    if (options.context !== undefined)
      this.context = options.context
  }

  public fork (context: object): Console {
    return new Console({
      level: this.level,
      format: this.formatter.name,
      streams: {
        stdout: this.stdout,
        stderr: this.stderr
      },
      context: { ...this.context, ...context }
    })
  }

  private channel (channel: Channel): Method {
    const level = LEVELS[channel]
    const severity = channel.toUpperCase() as Severity

    return (template: string, ...values: unknown[]) => {
      if (level < this.level)
        return

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

      const buffer = this.formatter.format(entry)

      if (channel === 'error')
        this.stderr.write(buffer)
      else
        this.stdout.write(buffer)
    }
  }
}

export const LEVELS: Record<Channel, number> = {
  debug: -2,
  info: -1,
  warn: 0,
  error: 1
}

export const console = new Console()

interface Options {
  level?: Channel | number
  streams?: Streams
  format?: Format
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

export type Channel = 'debug' | 'info' | 'warn' | 'error'
type Severity = Uppercase<Channel>
type Method = (template: string, ...values: unknown[]) => void
