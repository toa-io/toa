import { randomFillSync } from 'node:crypto'
import { state } from './state'
import { recording } from './exporters'

export function run<T> (context: SpanContext, fn: () => T): T {
  return state.storage.run(context, fn)
}

export function current (): SpanContext | undefined {
  return state.storage.getStore()
}

/**
 * Configures head-based sampling. Replaces the current configuration entirely.
 *
 * `sample` is the probability (0..1) of recording a trace, defaults to 1.
 * `rate` is the maximum number of recorded traces per second per process
 * (may be fractional: 0.5 is one trace per 2 seconds), unlimited when omitted.
 */
export function sampling (options: SamplingOptions = {}): void {
  state.sample = options.sample ?? 1
  state.bucket = options.rate === undefined ? null : new Bucket(options.rate)
}

/**
 * Makes the sampling decision for a trace root.
 */
export function decide (): boolean {
  // a span nothing consumes is not worth creating
  if (!recording())
    return false

  if (state.sample !== 1 && Math.random() >= state.sample)
    return false

  return state.bucket?.take() ?? true
}

export function create (parent?: SpanContext): SpanContext {
  const context: SpanContext = {
    traceId: parent?.traceId ?? id(TRACE_ID),
    spanId: id(SPAN_ID),
    sampled: parent?.sampled ?? decide()
  }

  if (parent?.spanId !== undefined)
    context.parentId = parent.spanId

  if (parent?.service !== undefined)
    context.service = parent.service

  return context
}

// https://www.w3.org/TR/trace-context/#traceparent-header
export function decode (traceparent: string): SpanContext | null {
  const match = EXPRESSION.exec(traceparent)

  if (match === null)
    return null

  const [, traceId, spanId, flags] = match

  if (traceId === ZERO_TRACE || spanId === ZERO_SPAN)
    return null

  return {
    traceId,
    spanId,
    sampled: (Number.parseInt(flags, 16) & SAMPLED) === SAMPLED
  }
}

export function encode (context: SpanContext): string {
  return `00-${context.traceId}-${context.spanId ?? ZERO_SPAN}-${context.sampled ? '01' : '00'}`
}

/**
 * Identifiers are drawn from a pre-filled buffer: a `randomBytes` call per span costs
 * an order of magnitude more than the rest of opening one, and a span is opened on
 * every call. Same source of randomness, refilled a few hundred identifiers at a time.
 */
function id (bytes: number): string {
  if (offset + bytes > POOL.length) {
    randomFillSync(POOL)
    offset = 0
  }

  const value = POOL.toString('hex', offset, offset + bytes)

  offset += bytes

  return value
}

const TRACE_ID = 16
const SPAN_ID = 8
const POOL = Buffer.allocUnsafe(4096)

let offset = POOL.length // forces a fill on the first draw

class Bucket {
  private readonly rate: number
  private readonly capacity: number
  private tokens: number
  private updated = Date.now()

  public constructor (rate: number) {
    this.rate = rate
    this.capacity = Math.max(rate, 1)
    this.tokens = this.capacity
  }

  public take (): boolean {
    const now = Date.now()

    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.updated) / 1000) * this.rate)
    this.updated = now

    if (this.tokens < 1)
      return false

    this.tokens--

    return true
  }
}

export interface SamplingOptions {
  sample?: number
  rate?: number
}

export interface SpanContext {
  traceId: string

  /** absent when the trace is adopted by ID only, without a known parent span */
  spanId?: string
  parentId?: string
  sampled: boolean

  /**
   * The logical service emitting the span (`service.name`).
   * Inherited by child spans within the process, never propagated over the wire.
   */
  service?: string

  /** Allows marking the active span as failed without throwing */
  status?: 'error'
}

const EXPRESSION = /^00-([\da-f]{32})-([\da-f]{16})-([\da-f]{2})$/
const ZERO_TRACE = '0'.repeat(32)
const ZERO_SPAN = '0'.repeat(16)
const SAMPLED = 0x01
