import { create, current, run } from './tracing'
import { exporters } from './exporters'
import type { Span } from './exporters'
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
    if (typeof arg === 'function')
      task = arg as Task<T>

    const parent = current()

    /*
     * An unsampled trace records nothing, and the context a child would inherit is the
     * one already in scope — so there is nothing to create and nothing to propagate.
     * The decision itself is made once, when the trace root is opened below.
     */
    if (parent !== undefined && !parent.sampled)
      return await task!()

    const options: SpanOptions = typeof naming === 'string' ? { name: naming } : naming

    if (typeof arg !== 'function')
      options.attributes = arg

    const context = create(parent)

    if (options.service !== undefined)
      context.service = options.service

    const time = Date.now()
    const start = performance.now()

    try {
      const result = await run(context, task!)

      this.complete(context, options, time, start)

      return result
    } catch (error) {
      this.complete(context, options, time, start, error)

      throw error
    }
  }

  /**
   * Writes a span as a TRACE log entry. Used by the console exporter.
   */
  public trace (span: Span): void {
    if (LEVELS.trace < this.level)
      return

    const fields: Partial<Entry> = {
      trace_id: span.traceId,
      span_id: span.spanId,
      duration: span.duration
    }

    if (span.parentId !== undefined)
      fields.parent_id = span.parentId

    if (span.kind !== 'internal')
      fields.kind = span.kind

    if (span.status !== undefined)
      fields.status = span.status

    this.write(LEVELS.trace, 'TRACE', span.name, span.attributes, fields)
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
  private complete (context: SpanContext, options: SpanOptions, time: number, start: number,
    error?: unknown): void {
    if (!context.sampled)
      return

    const span: Span = {
      name: options.name,
      traceId: context.traceId,
      spanId: context.spanId!,
      kind: options.kind ?? 'internal',
      time,
      duration: Math.round((performance.now() - start) * 1000) / 1000
    }

    if (context.parentId !== undefined)
      span.parentId = context.parentId

    if (options.attributes !== undefined)
      span.attributes = options.attributes

    if (this.context !== undefined)
      span.scope = this.context

    if (context.service !== undefined)
      span.service = context.service

    if (error !== undefined || context.status === 'error')
      span.status = 'error'

    for (const exporter of exporters())
      exporter.export(span, this)
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

const KEY = Symbol.for('openspan.console')

/**
 * A process may load several copies of this module (see `state.ts`).
 * The singleton is shared via `globalThis`, so that `configure()`
 * (e.g. the log level set by the telemetry extension) applies to every copy.
 */
export const console: Console = ((globalThis as Global)[KEY] ??= new Console())

type Global = typeof globalThis & { [KEY]?: Console }

/**
 * Passes an externally completed span to the exporters.
 * Used for event-based instrumentation (e.g. database drivers),
 * where spans cannot wrap a task.
 */
export function record (span: Span, output: Console = console): void {
  for (const exporter of exporters())
    exporter.export(span, output)
}

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

  /** the logical service emitting the span, inherited from the parent context when omitted */
  service?: string
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
