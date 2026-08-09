import { create, current, run } from './tracing'
import type { SpanContext } from './tracing'

export class Console {
  public readonly debug = this.channel('debug')
  public readonly log = this.debug
  public readonly info = this.channel('info')
  public readonly warn = this.channel('warn')
  public readonly error = this.channel('error')

  private level: Level = LEVELS.trace
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

  public async span<T> (name: string | SpanOptions, task: Task<T>): Promise<T>
  public async span<T> (name: string, attributes: object, task: Task<T>): Promise<T>
  public async span<T> (naming: string | SpanOptions, arg: object | Task<T>, task?: Task<T>): Promise<T> {
    const options: SpanOptions = typeof naming === 'string' ? { name: naming } : naming

    if (typeof arg === 'function')
      task = arg as Task<T>
    else
      options.attributes = arg

    const context = create(current())
    const start = performance.now()

    try {
      const result = await run(context, task!)

      this.complete(context, options, start)

      return result
    } catch (error) {
      this.complete(context, options, start, error)

      throw error
    }
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

      this.write(level, severity, message, attributes)
    }
  }

  // eslint-disable-next-line max-params
  private complete (context: SpanContext, options: SpanOptions, start: number, error?: unknown): void {
    const duration = Math.round((performance.now() - start) * 1000) / 1000

    if (!context.sampled || LEVELS.trace < this.level)
      return

    const span: Partial<Entry> = {
      trace_id: context.traceId,
      span_id: context.spanId,
      duration
    }

    if (context.parentId !== undefined)
      span.parent_id = context.parentId

    if (options.kind !== undefined && options.kind !== 'internal')
      span.kind = options.kind

    if (error !== undefined)
      span.status = 'error'

    this.write(LEVELS.trace, 'TRACE', options.name, options.attributes, span)
  }

  // eslint-disable-next-line max-params
  private write (level: Level, severity: Severity, message: string, attributes?: any, span?: Partial<Entry>): void {
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

    const context = current()

    if (context !== undefined) {
      entry.trace_id = context.traceId
      entry.span_id = context.spanId
    }

    if (span !== undefined)
      Object.assign(entry, span)

    const buffer = Buffer.from(JSON.stringify(entry) + '\n')

    if (level === LEVELS.error)
      this.stderr.write(buffer)
    else
      this.stdout.write(buffer)
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

export const LEVELS: Record<LevelName, Level> = {
  trace: -2,
  debug: -1,
  info: 0,
  warn: 1,
  error: 2
}

export const console = new Console()

export interface ConsoleOptions {
  level?: LevelName | Level
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
  trace_id?: string
  span_id?: string
  parent_id?: string
  duration?: number
  kind?: Kind
  status?: 'error'
}

export interface SpanOptions {
  name: string
  kind?: Kind // 'internal' when omitted
  attributes?: object
}

export type Channel = 'debug' | 'info' | 'warn' | 'error'

// `trace` is a level but not a channel: span entries are written with the TRACE severity
export type LevelName = 'trace' | Channel

// https://opentelemetry.io/docs/concepts/signals/traces/#span-kind
export type Kind = 'internal' | 'server' | 'client' | 'producer' | 'consumer'
export type Severity = Uppercase<LevelName>
export type Task<T> = () => T | Promise<T>
type Level = -2 | -1 | 0 | 1 | 2
type Method = (message: string, attributes?: any) => void
