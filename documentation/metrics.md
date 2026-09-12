# Metrics

A metric is recorded whether or not the trace is sampled. Nothing is collected and nothing is
measured until a metrics exporter is configured.

## Configuration

```yaml
# context.toa.yaml

telemetry:
  metrics:
    interval: 15000 # collection and export period, milliseconds
    exporters:
      otlp:
        endpoint: http://prometheus:9090/api/v1/otlp # POSTs to {endpoint}/v1/metrics
        timeout: 5000 # request timeout, milliseconds
        cooldown: 30000 # how long to drop series for after a failed export
```

|             |                                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| `interval`  | milliseconds between collections, and so between exports. Defaults to `15000` |
| `exporters` | where series are sent. Without it nothing is measured                         |
| `timeout`   | request timeout in milliseconds. Defaults to `5000`                           |
| `cooldown`  | milliseconds to drop series for after a failed export. Defaults to `30000`    |

Counters and histograms are cumulative from process start. Every series carries
`service.instance.id`, so replicas do not collide.

A missing or unavailable endpoint is reported with a single warning and series are dropped until it
recovers, so neither throughput nor shutdown is delayed by the absence of the backend.

Sampling does not apply. `telemetry.traces.sample` changes which traces are recorded and changes
nothing about a metric.

## Declaring a metric

A component records only the metrics its manifest declares.

```yaml
# manifest.toa.yaml

telemetry:
  metrics:
    conversions:
      type: counter
      labels:
        currency: [EUR, USD, GBP]
    orders:
      type: histogram
      unit: EUR
      buckets: [5, 20, 50, 100, 500]
      labels:
        channel: [web, app, partner]
    backlog:
      type: gauge
      labels: ~
```

|           |                                                             |
| --------- | ----------------------------------------------------------- |
| `type`    | `counter`, `gauge` or `histogram`                           |
| `labels`  | label keys, each with the values it admits, or `~` for none |
| `unit`    | what the values are in                                      |
| `buckets` | histogram bucket edges, ascending                           |

A label declared with a list admits those values and nothing else. A label declared with `~` admits
any value, and its cardinality is yours to keep bounded.

The series name is the component id and the declared name: `conversions` declared by
`default.orders` is `default.orders.conversions`.

## Which type to declare

A **counter** only goes up, and its value means nothing on its own: what is read is its rate.
Declare one for something that happens — a conversion, a rejection, a retry. Never for something
that can also go down.

A **gauge** is a level at a moment, and only the last value before a collection is exported. Declare
one for a quantity that stands: rows pending, connections held, bytes buffered. Never for counting,
because two increments in one interval export as one number.

A **histogram** is a distribution over buckets fixed at declaration, and yields quantiles, a count
and a sum. Declare one where the tail is the point — an amount, a size, a latency. Changing the edges
later starts the history over.

A duration needs no instrument: `context.span` measures its task and records the duration whether or
not the trace is sampled.

An outcome with a handful of values is a counter with a label, not a histogram.

## Recording

`context.metrics` carries one instrument per declared name.

```javascript
async function convert(input, context) {
  context.metrics.conversions.add(1, { currency: input.currency })

  return input.amount * (await rate(input.currency))
}
```

```javascript
async function checkout(input, context) {
  context.metrics.orders.record(input.total, { channel: input.channel })
}
```

```javascript
async function sweep(input, context) {
  const rows = await context.storage.find({ state: 'pending' })

  context.metrics.backlog.set(rows.length)
}
```

|          |                               |
| -------- | ----------------------------- |
| `add`    | counter, by a positive amount |
| `record` | histogram, one observation    |
| `set`    | gauge, the value it now holds |

Every declared label key takes a value on every call.

**A value the label does not enumerate is recorded under `UNDECLARED`.** The invocation is not
affected, and the first such value for that label is written to the log.

```javascript
// input.currency is 'CHF', which the manifest does not enumerate
context.metrics.conversions.add(1, { currency: input.currency }) // → { currency: 'UNDECLARED' }
```

**An instrument the manifest does not declare raises `Misuse`.** The failure is permanent: where
nobody is waiting, the message is parked on its first delivery rather than retried. See
[errors and exceptions](/documentation/exceptions.md).

## What a metric cannot show

**Nothing below `interval`.** One collection is one sample per series, and a `rate()` window shorter
than about four intervals has too few samples to be trusted.

A counter and a histogram lose nothing to this — every increment and every observation between two
collections is in the next value, and only its position in time is lost. **A gauge loses the value
itself**: a level that rose and fell between two collections was never recorded. Where a level moves
faster than `interval`, a gauge cannot show it.

**Nothing finer than a bucket edge.** A quantile is interpolated inside a bucket.

## What it costs

A metrics backend charges for label values, not for measurements. Traffic is free: a series costs the
same at ten requests a second and at ten thousand. Every label combination is a series, every
histogram bucket is a series of its own — twelve edges are fifteen series per combination — and a
series that stops being written still occupies the retention.

See [Do not overuse labels](https://prometheus.io/docs/practices/instrumentation/#do-not-overuse-labels)
and [Histograms and summaries](https://prometheus.io/docs/practices/histograms/).

## What the runtime records

Durations are seconds. A component's own metrics are named after it; the runtime's are prefixed
`toa`.

### Core

| metric                       | type           | labels                                      |
| ---------------------------- | -------------- | ------------------------------------------- |
| `toa.operation.duration`     | histogram, `s` | `component`, `operation`                    |
| `toa.operation.errors`       | counter        | `component`, `operation`, `code`            |
| `toa.operation.exceptions`   | counter        | `component`, `operation`, `code`, `outcome` |
| `toa.operation.inflight`     | gauge          | `component`                                 |
| `toa.call.duration`          | histogram, `s` | `component`, `operation`                    |
| `toa.call.exceptions`        | counter        | `component`, `operation`, `code`            |
| `toa.call.inflight`          | gauge          | `component`                                 |
| `toa.event.publish.duration` | histogram, `s` | `event`                                     |

`toa.operation.*` is an invocation as the component that serves it sees it, with no transport in it.
`toa.call.*` is the same invocation as its caller sees it, transport included; `component` there is
the callee. A remote call is one of each, in two processes.

An operation's three outcomes divide as follows. A declared error it returned is
`toa.operation.errors`, by the `code` the manifest declares. An exception is
`toa.operation.exceptions`, by core's code name and by `outcome`, which is `permanent` or
`transient` — whether another attempt could pass. Success is the duration histogram's `_count` less
the two, because the histogram observes every invocation, failures included.

`toa.call.exceptions` counts only what transmission raised — `Transmission`, `Addressee`,
`Abandoned`, `Endpoint` — and never one the callee sent back, which is counted where it happened.

### Bindings

| metric                 | type    | labels                                           |
| ---------------------- | ------- | ------------------------------------------------ |
| `toa.amqp.published`   | counter | `topology` (`request`, `task`, `event`), `shard` |
| `toa.amqp.diagnostics` | counter | `condition`, `shard`                             |

`toa.amqp.published` counts what this process put on a broker. Consumption is not counted here: an
arriving message is an invocation, and is `toa.operation.duration`.

`condition` is one of the broker conditions the connector reports — `return`, `discard`, `taken`,
`remove`, `lost`, `recover`, `flow`, `drain`, `close`, `error`, `reconnect`, `exhausted`, `open`.

### Storage

| metric                       | type           | labels                                |
| ---------------------------- | -------------- | ------------------------------------- |
| `toa.storage.query.duration` | histogram, `s` | `provider`, `collection`, `operation` |
| `toa.storage.conflicts`      | counter        | `provider`, `collection`              |

`provider` is which storage it is, `mongodb` among them. There is no database label: the database is
the context, which the series already carries as its `job`.

`toa.storage.conflicts` counts a lost compare-and-swap. Where the operation declares
`concurrency: retry` it is retried and succeeds, so this counter is the only place it appears;
otherwise it is also `toa.operation.exceptions{code="StateConcurrency"}`.

### Atomicity

| metric                    | type           | labels      |
| ------------------------- | -------------- | ----------- |
| `toa.atomicity.lock.wait` | histogram, `s` | `component` |
| `toa.atomicity.locks`     | gauge          | `component` |

A lock is waited for as long as it takes to acquire, inside the operation that asked for it.

### Stash

| metric                       | type           | labels    |
| ---------------------------- | -------------- | --------- |
| `toa.stash.command.duration` | histogram, `s` | `command` |

### Cadence

| metric                   | type    | labels                                       |
| ------------------------ | ------- | -------------------------------------------- |
| `toa.cadence.pulses`     | counter | `component`, `operation`                     |
| `toa.cadence.skipped`    | counter | `component`, `reason` (`overlap`, `unowned`) |
| `toa.cadence.delayed`    | counter | `component`                                  |
| `toa.cadence.dispatched` | counter | `component`                                  |
| `toa.cadence.expired`    | counter | `component`                                  |
| `toa.cadence.scans`      | counter | `outcome` (`done`, `skipped`, `failed`)      |

The rate a pulse should keep is `cycle / intervals` from its manifest; `toa.cadence.pulses` is what
it kept. An interval is not made up, so what is below that rate is gone.

`delayed` is calls handed over to be made later, `dispatched` is those made, `expired` is those
dropped for passing their `overdue`. What is still waiting is the residue of the three.

`toa.cadence.scans` is the pass over delayed calls. A pass that outlives its interval takes every
pass after it, and nothing is dispatched while that lasts.

### Outbox

| metric                  | type       | labels        |
| ----------------------- | ---------- | ------------- |
| `toa.outbox.pending`    | gauge      | `destination` |
| `toa.outbox.age`        | gauge, `s` | `destination` |
| `toa.outbox.failures`   | counter    | `destination` |
| `toa.outbox.unassigned` | gauge      | —             |

`toa.outbox.age` is how long the oldest unpublished record has waited. It is the number to alert on:
a pump that stopped, a broker refusing and lanes nobody owns all read as this rising.

`toa.outbox.unassigned` is cycles in a row this replica was given no lane. Ten in a row means this
outbox recovers nothing: a publication that failed is never retried.

### Exposition

| metric                            | type           | labels                      |
| --------------------------------- | -------------- | --------------------------- |
| `toa.exposition.request.duration` | histogram, `s` | `method`, `route`           |
| `toa.exposition.responses`        | counter        | `method`, `route`, `status` |

`route` is the route template, and `none` where the request matched no route.

### Fetch

| metric                | type           | labels                       |
| --------------------- | -------------- | ---------------------------- |
| `toa.fetch.duration`  | histogram, `s` | `origin`, `method`           |
| `toa.fetch.responses` | counter        | `origin`, `method`, `status` |
| `toa.fetch.retries`   | counter        | `origin`                     |

One attempt is one observation, so a retried request is several.

### BLOB storages

| metric                        | type           | labels                             |
| ----------------------------- | -------------- | ---------------------------------- |
| `toa.blob.operation.duration` | histogram, `s` | `storage`, `provider`, `operation` |

`storage` is the name the component declared it under — `storages: tmp` is `tmp` — and `provider` is
what stands behind it.

### Convergence

| metric                     | type           | labels                                                  |
| -------------------------- | -------------- | ------------------------------------------------------- |
| `toa.convergence.lag`      | histogram, `s` | `region`, `outcome` (`inserted`, `superseded`, `stale`) |
| `toa.convergence.backward` | counter        | `region`                                                |

The lag is the receiving region's clock less the timestamp the record carries from the region that
wrote it, so it is no better than the clocks: choose an alert threshold well above the skew you
expect. A lag that comes out negative is recorded as zero and counted as `toa.convergence.backward`,
which is therefore a measure of the skew itself.

### Realtime

| metric                  | type    | labels  |
| ----------------------- | ------- | ------- |
| `toa.realtime.pushed`   | counter | `event` |
| `toa.realtime.failures` | counter | `event` |

`pushed` is events handed to the streams component, not events delivered to clients.

### Process

| metric                   | type           | labels                             |
| ------------------------ | -------------- | ---------------------------------- |
| `toa.process.loop.delay` | histogram, `s` | —                                  |
| `toa.process.memory`     | gauge          | `kind` (`rss`, `heap`, `external`) |

Recorded by every process that has metrics configured, the gateway included.
