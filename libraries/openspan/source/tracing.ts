import { AsyncLocalStorage } from 'node:async_hooks'
import { randomBytes } from 'node:crypto'

const storage = new AsyncLocalStorage<SpanContext>()

export function run<T> (context: SpanContext, fn: () => T): T {
  return storage.run(context, fn)
}

export function current (): SpanContext | undefined {
  return storage.getStore()
}

export function create (parent?: SpanContext): SpanContext {
  const context: SpanContext = {
    traceId: parent?.traceId ?? randomBytes(16).toString('hex'),
    spanId: randomBytes(8).toString('hex'),
    sampled: parent?.sampled ?? true
  }

  if (parent !== undefined)
    context.parentId = parent.spanId

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
  return `00-${context.traceId}-${context.spanId}-${context.sampled ? '01' : '00'}`
}

export interface SpanContext {
  traceId: string
  spanId: string
  parentId?: string
  sampled: boolean
}

const EXPRESSION = /^00-([\da-f]{32})-([\da-f]{16})-([\da-f]{2})$/
const ZERO_TRACE = '0'.repeat(32)
const ZERO_SPAN = '0'.repeat(16)
const SAMPLED = 0x01
