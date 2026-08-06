export class Console {
  public readonly debug = this.channel('debug')
  public readonly log = this.debug
  public readonly info = this.channel('info')
  public readonly warn = this.channel('warn')
  public readonly error = this.channel('error')

  private level: Level = LEVELS.debug
  private stdout: NodeJS.WriteStream = process.stdout
  private stderr: NodeJS.WriteStream = process.stderr
  private context?: any

  public constructor (options: ConsoleOptions = {}) {
    this.configure(options)
  }

  public configure (options: ConsoleOptions = {}): void {
    if (options.level !== undefined)
      this.level = typeof options.level === 'string' ? LEVELS[options.level] : options.level

    if (options.streams !== undefined) {
      this.stdout = options.streams.stdout
      this.stderr = options.streams.stderr
    }

    if (options.context !== undefined)
      this.context = options.context
  }

  public fork (ctx?: any): Console {
    const options: ConsoleOptions = {
      level: this.level,
      streams: {
        stdout: this.stdout,
        stderr: this.stderr
      }
    }

    const context = this.context === undefined ? ctx : { ...this.context, ...ctx }

    if (context !== undefined)
      options.context = context

    return new Console(options)
  }

  private channel (channel: Channel): Method {
    const level = LEVELS[channel]
    const severity = channel.toUpperCase() as Severity

    return (message: string, attributes?: any) => {
      if (level < this.level)
        return

      const entry: Entry = {
        severity,
        message,
        time: new Date().toISOString()
      }

      if (attributes instanceof Error)
        entry.attributes = serialize(attributes)
      else if (attributes !== undefined)
        entry.attributes = attributes

      if (this.context !== undefined)
        entry.context = this.context

      const buffer = Buffer.from(JSON.stringify(entry) + '\n')

      if (level === LEVELS.error)
        this.stderr.write(buffer)
      else
        this.stdout.write(buffer)
    }
  }
}

function serialize (error: Error): Record<string, any> {
  const attributes: Record<string, any> = { message: error.message }

  // @ts-expect-error -- custom error classes
  if (error.code !== undefined)
    // @ts-expect-error -- custom error classes
    attributes.code = error.code

  if (error.stack !== undefined)
    attributes.stack = error.stack

  if (error.cause !== undefined)
    attributes.cause = error.cause instanceof Error ? serialize(error.cause) : error.cause

  return attributes
}

export const LEVELS: Record<Channel, Level> = {
  debug: -1,
  info: 0,
  warn: 1,
  error: 2
}

export const console = new Console()

export interface ConsoleOptions {
  level?: Channel | Level
  context?: any
  streams?: Streams
}

interface Streams {
  stdout: NodeJS.WriteStream
  stderr: NodeJS.WriteStream
}

export interface Entry {
  time: string
  severity: Severity
  message: string
  attributes?: Record<string, any>
  context?: Record<string, any>
}

export type Channel = 'debug' | 'info' | 'warn' | 'error'
export type Severity = Uppercase<Channel>
type Level = -1 | 0 | 1 | 2
type Method = (message: string, attributes?: any) => void
