# Telemetry

## Structured logs

Structured logs can be written using the `logs` Context Aspect.

```javascript
async function computation (input, context) {
  context.logs.info('Hello, world', { foo: 'bar' })
}
```

Methods `debug`, `info`, `warn`, and `error` are available to log messages with different severity
levels, with the following signature:

```
(message: string, attributes?: object) => void
```

Logs are formatted as JSON and written to stdout or stderr. The log entry format is:

```yaml
time: string        # ISO 8601 timestamp
severity: string    # TRACE, DEBUG, INFO, WARN, ERROR
message: string
attributes?: object
context:
  namespace: string
  component: string
  operation: string
trace_id?: string   # see Tracing
span_id?: string
```

### Logs configuration

Logs can be configured using `telemetry` Context Annotation.

- `level`: limits the minimum log level.
  It can be set to `trace`, `debug`, `info` (default), `warn`, or `error`.

```yaml
# context.toa.yaml

telemetry:
  logs:
    level: debug  # trace < debug < info < warn < error
    level@production: info
```

Logs configuration can be overridden for specific components.

```yaml
# context.toa.yaml

telemetry:
  logs:
    level: info
    identity.federation:
      level: debug
```

## Tracing

Each operation invocation runs within a *span*.
If the incoming request carries a trace context ([W3C Trace Context](https://www.w3.org/TR/trace-context/)),
the span continues the trace, otherwise a new trace starts.
All log entries written during the invocation are automatically stamped with `trace_id` and
`span_id`, so entries belonging to one invocation can be correlated.

When a span completes, an entry with the `TRACE` severity is written with the span name as the
message and the following additional fields:

```yaml
trace_id: string   # 32 hex characters, shared by all spans and logs of the trace
span_id: string    # 16 hex characters
parent_id?: string # span_id of the enclosing span
duration: number   # milliseconds
kind?: string      # server, client, producer, consumer; internal when omitted
status?: error     # present if an exception was thrown
```

Remote calls produce a `client`/`server` span pair: the gap between their durations
is the transport latency. Spans created with `context.span` are `internal`.

Emitting an event produces a `producer` span measuring the broker publish confirmation,
and each receiver processes the event within a `consumer` span, which is a child of the
`producer` span. Event processing does not block the emitting operation, so `consumer`
spans may complete after the operation span ends.

Spans marked with `status: error` are those that threw an exception, operation invocations
that returned an exception, and HTTP requests that resulted in a 5xx response.
Successful spans have no status, as [recommended](https://opentelemetry.io/docs/specs/otel/trace/api/#set-status)
by the OpenTelemetry specification.

Connectors may record additional spans within the trace of the current invocation
(see the documentation of a specific connector).

Process startup can be traced as well: with `TOA_BOOT_TRACE=1`, `toa compose` and
`toa serve` produce a trace covering boot phases (manifest loading, component creation)
and connector connections, so the startup time breakdown can be explored.
Boot tracing is disabled by default.

```shell
TOA_BOOT_TRACE=1 toa compose ./components/*
```

Span entries are written only when the `trace` log level is enabled (the default on local
environments). Spans are executed regardless of the log level.

### Custom spans

Sub-steps of an operation can be measured using the `span` Context Aspect:

```javascript
async function computation (input, context) {
  const rate = await context.span('fetch rate', () => fetch(RATES_URL))

  return input.amount * rate
}
```

`context.span` executes the given function and writes a span entry with its duration.
The signature is:

```
span<T>(name: string, task: () => T | Promise<T>): Promise<T>
span<T>(name: string, attributes: object, task: () => T | Promise<T>): Promise<T>
```

- `name`: constant span name (same rules as log messages, see best practices).
- `attributes`: optional, written to the span entry as-is — same as the `attributes`
  argument of `context.logs` methods.
- `task`: the function to execute. Its result is returned as-is, and an exception is
  rethrown after the span entry is written with `status: error`.

Spans can be nested: spans created and logs written inside `task` are linked to the enclosing
span.

```javascript
async function computation (input, context) {
  return context.span('convert', { currency: input.currency }, async () => {
    const rate = await context.span('fetch rate', () => fetch(RATES_URL))

    context.logs.info('Rate received', { rate })

    return input.amount * rate
  })
}
```

### Sampling

Whether a trace is recorded is decided once, at the trace root — by the process that starts
the trace. The decision is propagated along with the trace context, so a trace is either
recorded as a whole or not at all. Unrecorded traces still create and propagate the trace
context: log entries carry `trace_id`, only span entries are not written.

```yaml
# context.toa.yaml

telemetry:
  traces:
    sample: 0.1  # probability of recording a trace, 0..1, defaults to 1
    rate: 5      # maximum recorded traces per second per process, unlimited when omitted
```

- `sample: 0` disables recording entirely, `1` records every trace.
- `rate` protects against traffic spikes: with `sample`, the recorded volume is proportional
  to the traffic, while `rate` sets a hard cap (token bucket). It may be fractional:
  `0.5` is one trace per 2 seconds.

When both are set, a trace is recorded if the `sample` lottery passes *and* the rate limit
is not exceeded.

### Exporting

Recorded spans are passed to a set of *exporters*:

- `console` — writes spans as `TRACE` log entries to stdout (requires the `trace` log level,
  the default on local environments)
- `otlp` — sends spans to an [OTLP/HTTP](https://opentelemetry.io/docs/specs/otlp/#otlphttp)
  endpoint (Grafana Tempo, OpenTelemetry Collector, etc.), batched

The OTLP `service.name` resource attribute is the logical service emitting the span:
the component id (e.g. `default.orders`) for operation spans and their outgoing calls,
or `exposition` for HTTP request spans.

```yaml
# context.toa.yaml

telemetry:
  traces:
    exporters:
      console: ~
      otlp:
        endpoint: http://tempo:4318  # POSTs to {endpoint}/v1/traces
```

When the `exporters` key is omitted, spans are exported to the console.
When it is present, it is exhaustive: list `console` explicitly to keep it.

Local `docker compose up tempo grafana` starts [Tempo](https://grafana.com/oss/tempo/)
(OTLP on `http://localhost:4318`) and [Grafana](http://localhost:3000) to explore the traces.

## Logs best practices

Use constant messages and attributes to facilitate log analysis.

:-1: Don't:

```javascript
context.logs.info(`User ${user.id} created`)
```

:+1: Do:

```javascript
context.logs.info('User created', { id: user.id })
```

Use concise messages and attributes to provide context of the event, to identify the source of the
log entry.
Do not include stories, explanations, or required actions in the log message.
Logs are not comments or documentation, nor are they a replacement for them.

:-1: Don't:

```javascript
context.logs.error('Failed to send the email, please check the email server configuration')
```

:+1: Do:

```javascript
context.logs.error('Failed to send the email', {
  reason: 'SMTP error',
  status: response.statusCode
})
```

Avoid logging any information received from the user.
It may contain private, sensitive, security-related, or GDPR protected data.

:-1: Don't:

```javascript
context.logs.info('User logged in', { name: user.name })
context.logs.error('Failed to send chat message', { message: message.text })
```

:x: Never do:

```javascript
context.logs.error('Password is incorrect', { password: credentials.password })
context.logs.info('Payment received', { creditCard: card.number })
```

Choose the appropriate log level for the message:

- `debug`: Used for development and troubleshooting purposes. Should not be enabled in production.
- `info`: Tracks the application flow and provides context for events.
- `warn`: Indicates potential issues that may require attention.
- `error`: Indicates a failure or an unexpected event that requires immediate attention.

Avoid logging configuration objects, as they may contain secrets. Log specific values instead.

:-1: Don't:

```javascript
context.logs.debug('Configuration', context.configuration)
```

:+1: Do:

```javascript
context.logs.debug('Limits', {
  max: context.configuration.limits.max,
  min: context.configuration.limits.min
})
```

## Ready probe

Compositions expose `GET /.ready` (default port `8001`) for Kubernetes startup/readiness probes.
The endpoint returns `503` until the composition has connected, then `200` after a short delay.

Configure or disable via `telemetry` Context Annotation:

```yaml
# context.toa.yaml
telemetry:
  ready:
    port: 8001
    delay: 3
```

```yaml
telemetry:
  ready: false
```
