# Tracing

Each incoming request is processed within a [trace](../../telemetry/readme.md#tracing) —
a server span is created, and its trace context is propagated to component invocations and
emitted events, so all log entries and spans across the application caused by the request
share the same `trace_id`.

## The `ray` response header

Each response contains a `ray` header with the trace ID of the request.
It can be used to find related log entries, or be attached to a support ticket.

Log entries are stamped with the trace ID regardless of the sampling decision,
while the trace itself is only recorded if the trace is sampled (see [Sampling](#sampling)).

```
HTTP/1.1 201 Created
ray: 0af7651916cd43dd8448eb211c80319c
```

## Continuing a trace

By default, the trace starts at the gateway. If the request carries a trace context in one of the
following headers, the trace is continued, that is, the incoming trace ID is used.

### `traceparent`

The [W3C Trace Context](https://www.w3.org/TR/trace-context/#traceparent-header) header, sent by
clients instrumented with OpenTelemetry-compatible tooling, or by upstream proxies.

```
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
```

In addition to the trace ID, it carries the ID of the client span, which becomes the *parent* of
the gateway's server span, linking client-side and server-side spans into a single trace tree.

### `ray`

A bare trace ID (32 lowercase hex digits), for clients without tracing instrumentation willing to
correlate their requests with server-side traces.

```
ray: 4bf92f3577b34da6a3ce929d0e0e4736
```

Unlike `traceparent`, it carries no parent span, so the gateway's server span becomes the root of
the trace.

If both headers are present, `traceparent` takes precedence as it carries more information.
Headers with invalid values are ignored, and a new trace is started.

## Sampling

The trace *context* (trace ID) is always created and propagated, so the `ray` header and
`trace_id` in log entries are always present. The sampling decision only determines whether
the *spans* of the trace are recorded.

The decision is made once, by the process that starts the trace, and is propagated along with
the trace context (the flags byte of `traceparent`), so a trace is either recorded as a whole
or not at all.

Sending a trace context does not bypass sampling: whether the trace is recorded is decided by the
server. The incoming trace ID is used for correlation, not as a recording demand.

## See also

- [Telemetry extension](../../telemetry/readme.md) — spans, structured logs, `context.span`
