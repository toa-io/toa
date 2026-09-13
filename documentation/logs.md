# Logs

An entry a component writes through `context.logs` goes to every configured log exporter. There
are two: the console, which writes the JSON line to stdout and stderr and is on unless a
deployment turns it off, and `otlp`, which batches entries and posts them to an endpoint and is
off until one is configured.

The two are independent. Configuring `otlp` does not stop the line being written, and turning the
console off does not require an endpoint.

## Configuration

```yaml
# context.toa.yaml

telemetry:
  logs:
    level: info # trace < debug < info < warn < error
    exporters:
      console: false # stops the JSON line being written; on when omitted
      otlp:
        endpoint: http://loki:3100/otlp # POSTs to {endpoint}/v1/logs
        timeout: 5000 # request timeout, milliseconds
        cooldown: 30000 # how long to drop entries for after a failed export
        headers: # sent with every request, e.g. for authentication
          authorization: Basic ...
```

|             |                                                                             |
| ----------- | --------------------------------------------------------------------------- |
| `level`     | the minimum severity written and exported. Defaults to `info`               |
| `exporters` | where entries go. Without it the console alone writes them                  |
| `timeout`   | request timeout in milliseconds. Defaults to `5000`                         |
| `cooldown`  | milliseconds to drop entries for after a failed export. Defaults to `30000` |

`level` is per component as well, and the override applies to both exporters:

```yaml
telemetry:
  logs:
    level: info
    identity.federation:
      level: debug
```

A missing or unavailable endpoint is reported with a single warning and entries are dropped until
it recovers, so neither throughput nor shutdown is delayed by the absence of the backend.

## What a record carries

The message is the record body. The attributes the call passed, and the component context
(`namespace`, `component`, `operation`), are record attributes. The severity travels as both
`severityText` and `severityNumber`, and the trace in scope as `traceId` and `spanId`.

Records are exported under one resource for the process:

| attribute                     | value                                       |
| ----------------------------- | ------------------------------------------- |
| `service.name`                | the context, or `exposition` in the gateway |
| `service.namespace`           | the context                                 |
| `deployment.environment.name` | `TOA_ENV`                                   |

Entries are sent in batches (512 entries or every 5 seconds) and flushed on process exit; abrupt
termination (`SIGKILL`) may lose the last batch.

An entry written within a trace that was not sampled still carries its `trace_id`, so a record may
name a trace the trace backend never received.

Two identical messages written within the same millisecond, from the same process, may reach the
backend as one: an entry's time is millisecond-resolution, and a backend is free to read a
repeated timestamp and line as a duplicate.

## What is not a log

The `toa` CLI writes to stdout for whoever is running it. That output is not telemetry, carries no
severity and no context, and reaches no exporter.
