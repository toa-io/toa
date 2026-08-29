# Telemetry tools

## Console

Console provides methods `debug`, `info`, `warn`, and `error` to write structured log entries
to stdout (stderr for `error`) as JSON lines.

`(message: string, attributes?: object | Error) => void`

When an `Error` is passed as attributes, it is serialized with its `message`, `code`, `stack`,
and `cause` chain.

Log entry format:

```yaml
time: string       # ISO 8601 timestamp
severity: string   # TRACE, DEBUG, INFO, WARN, ERROR
message: string
attributes?: object
context?: object   # context passed to the constructor
trace_id?: string  # present when written within a span
span_id?: string
```

### Example

```javascript
const console = new Console({ context: { component: 'my-app' } })

console.info('Hello, world!', { foo: 'bar' })

/*
severity: INFO
context: { component: my-app }
time: 2020-01-01T00:00:00.000Z
message: Hello, world!
attributes:
  foo: bar
*/
```

```javascript
import { console } from 'openspan'

console.configure({ level: 'warn' })
console.info('ignored')
```

Levels: `trace` < `debug` < `info` < `warn` < `error`.
`trace` is a level but not a channel: span entries are written with the `TRACE` severity.

## Spans

`console.span` executes a task within a span and writes a span entry with the `TRACE` severity
upon its completion. The task result is returned as-is, an exception is rethrown after the span
entry is written with `status: error`.

```
span<T>(name: string, task: () => T | Promise<T>): Promise<T>
span<T>(name: string, attributes: object, task: () => T | Promise<T>): Promise<T>
span<T>(options: SpanOptions, task: () => T | Promise<T>): Promise<T>
```

```javascript
const response = await console.span('fetch', { foo: 'bar' }, () => fetch('https://example.com'))
```

Span entry additional fields:

```yaml
trace_id: string   # 32 hex characters, shared by all spans and logs of the trace
span_id: string    # 16 hex characters
parent_id?: string # span_id of the enclosing span
duration: number   # milliseconds
kind?: string      # server, client, producer, consumer; internal when omitted
status?: error     # present if an exception was thrown
```

Spans nest: spans created and logs written inside the task are linked to the enclosing span
through [AsyncLocalStorage](https://nodejs.org/api/async_context.html).

`SpanOptions.service` declares the logical service emitting the span (the OTLP `service.name`).
It is inherited by nested spans within the process and is not propagated over the wire.

A span can be marked as failed without throwing:

```javascript
await console.span('work', () => {
  current().status = 'error'
})
```

## Tracing

The `tracing` module provides trace context primitives compatible with
[W3C Trace Context](https://www.w3.org/TR/trace-context/).

```javascript
import { create, current, run, decode, encode } from 'openspan'

const remote = decode(request.headers.traceparent) // SpanContext | null

await run(remote, async () => {
  // spans and logs here continue the remote trace
  console.info('Correlated', { trace: current().traceId })
})

message.telemetry = encode(current()) // '00-{trace_id}-{span_id}-{flags}'
```

- `create(parent?)` — creates a span context: a root (with a sampling decision) or a child.
- `current()` — the active span context, if any.
- `run(context, fn)` — executes `fn` with the given context as active.
- `decode(traceparent)` / `encode(context)` — W3C `traceparent` codec.

The trace context, the sampling configuration and the exporters are shared via `globalThis`,
so multiple copies of the package loaded within one process (e.g. installed both locally
and within a globally installed runtime) act as one: spans keep their parents across copies,
and the sampling decision is never re-made in the middle of a trace.

## Sampling

Head-based sampling: the decision is made once when a trace root is created, and is inherited
by child contexts. Unsampled spans execute normally and propagate the context, but are not
exported; log entries carry `trace_id` regardless.

```javascript
import { sampling } from 'openspan'

sampling({
  sample: 0.1, // probability of recording a trace, 0..1, defaults to 1
  rate: 5      // maximum recorded traces per second, unlimited when omitted (may be fractional)
})
```

`sampling()` replaces the configuration entirely, `decide()` makes a sampling decision for
a trace root (used when adopting a trace by ID).

## Exporters

Completed spans are passed to a set of exporters. The default is the console exporter, which
writes spans as `TRACE` log entries using the emitting console, respecting its log level.

The `Otlp` exporter sends batches of spans to an
[OTLP/HTTP](https://opentelemetry.io/docs/specs/otlp/#otlphttp) endpoint (JSON encoding):
spans are flushed when the batch is full, on an interval, and on process exit.

```javascript
import { exporting, consoleExporter, Otlp } from 'openspan'

exporting([consoleExporter, new Otlp({ endpoint: 'http://localhost:4318' })])
```

`OtlpOptions.service` is the fallback `service.name` for spans without a declared service
(defaults to the `TOA_CONTEXT` environment variable, then `toa`).

An absent or unavailable endpoint is tolerated and never affects the process: a request is
bounded by `timeout` (5s by default) and its socket is released as soon as it expires, a failed
batch is dropped, and the exporter then suspends itself for `cooldown` (30s by default),
dropping spans instead of queueing them. One warning is logged per outage, and one info entry
when the endpoint recovers. As a result a shutdown waits at most one `timeout` for an
unreachable endpoint, and nothing at all while the exporter is suspended.

Custom exporters implement the `Exporter` interface: `export(span, output)` is called for each
completed sampled span, optional `flush()` is awaited on shutdown.

`record(span)` passes an externally completed span to the exporters — for event-based
instrumentation (e.g. database driver monitoring events), where a span cannot wrap a task.

`traces()` configures sampling and exporters at once:

```javascript
import { traces } from 'openspan'

traces({
  sample: 0.1,
  exporters: {
    console: null,
    otlp: { endpoint: 'http://localhost:4318' }
  }
})
```
