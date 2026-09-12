# Metrics

## Design concept

`openspan` gains a `metrics` signal beside `traces`. Configuration is symmetric, exporters are
symmetric, and the two are independent: metrics without traces is a valid deployment.

Traces stay the instrument for _why_. Metrics become the instrument for _whether_ — unsampled, cheap
enough to be always on, and off until an exporter is configured.

### Guarantees

**Truth**

1. A metric is recorded whether or not the trace is sampled, and whether or not any span is
   exported.
2. With no `metrics` annotation, nothing is measured — recording costs one boolean check, mirroring
   `recording()` ([`exporters.ts:46`](/libraries/openspan/source/exporters.ts)). Declared without an
   exporter, a process measures into its registry and posts nothing, which is what a test reading
   its own process wants and costs no timer.
3. Counters and histograms are cumulative from process start. Every exported series carries
   `service.instance.id`, so replicas do not collide into a counter that appears to reset.

**Cardinality**

4. A userland instrument exists only where a component manifest declares it, and carries only the
   label keys that declaration names. The manifest is read and validated by `toa`, so a malformed
   declaration fails there and not at boot.
5. A label that enumerates its values admits nothing else: a value outside the enumeration is
   recorded under `UNDECLARED`, never failing the invocation — it came from data, and data changes
   after a manifest is written. The number of series a component can produce is therefore known
   from its manifest.
6. It is warned about once per label and not once per value, so what the runtime remembers about
   the values it has refused is bounded by the manifest and not by the data.
7. An instrument name the manifest does not declare throws `MisuseException`, a coded exception
   from `@toa.io/core` classified `permanent` — so a receiver parks the message on its first
   delivery rather than retrying a fault no attempt can clear.
8. The runtime's own metrics are declared in code, not in a manifest — the manifest governs
   `context.metrics` and nothing else. Their label values come only from bounded sources: component
   ids, endpoint names, route templates, event labels, error codes. Never a URL, an identifier, or
   user input.

**Export**

9. A missing or unavailable endpoint costs one warning and dropped series, never throughput and
   never shutdown — the same contract `Otlp` already keeps for spans
   ([`Otlp.ts:13`](/libraries/openspan/source/Otlp.ts)).

**Not promised**

10. No pull endpoint, no Prometheus text format, and no console exporter. Metrics are pushed.
11. No exemplars linking a series to a trace.
12. No cross-process aggregation: each process exports its own series and the backend sums them.
13. No instrument created at runtime. A metric a component did not declare is a metric it does not
    have, and adding one is a deploy.
14. No choice of which runtime metrics run. The set is fixed; the exporter is the switch.

### What a component author does differently

Nothing, unless they want a metric of their own — and then they declare it in the manifest, the way
a pulse is declared ([`extensions.cadence/manifest.ts`](/definitions/source/extensions.cadence/manifest.ts)).
A series that no manifest names does not exist, and a label that enumerates its values admits
nothing else, so cardinality is bounded by what `toa` has already read and validated.

```yaml
# manifest.toa.yaml

telemetry:
  metrics:
    conversions:
      type: counter
      labels:
        currency: [EUR, USD, GBP] # enumerated: three series, whatever the input says
    orders:
      type: histogram
      unit: EUR
      buckets: [5, 20, 50, 100, 500]
      labels:
        channel: [web, app, partner]
    backlog:
      type: gauge
      labels: ~ # one series
```

`context.metrics` carries one instrument per declared name and nothing else:

```javascript
// a counter counts what only ever happens
async function convert(input, context) {
  context.metrics.conversions.add(1, { currency: input.currency })

  return input.amount * (await rate(input.currency))
}
```

```javascript
// a histogram measures a quantity whose distribution matters — an amount, a size, a duration
async function checkout(input, context) {
  context.metrics.orders.record(input.total, { channel: input.channel })
}
```

```javascript
// a gauge is a value that moves both ways; what is exported is whatever it was set to last
async function sweep(input, context) {
  const rows = await context.storage.find({ state: 'pending' })

  context.metrics.backlog.set(rows.length)
}
```

A duration needs no instrument: `context.span` measures its task already, and records the duration
whether or not the trace is sampled.

Two misuses, answered differently because one is a bug and the other is the world moving on.

**An undeclared instrument throws `MisuseException`.** The name is a literal in the source, so it is
wrong on every invocation of that path and wrong on every retry — a failure nobody chose, which is
what [`exceptions.md`](/documentation/exceptions.md) defines an exception to be.

**An unenumerated label value is recorded under `UNDECLARED`** and warned about once per label. The
value came from data, the manifest was written before that data existed, and a new currency
appearing in production is not a reason for the operation to fail.

```javascript
// input.currency is 'CHF', which the manifest does not enumerate
context.metrics.conversions.add(1, { currency: input.currency }) // → { currency: 'UNDECLARED' }
```

And for a deployment, one annotation:

```yaml
# context.toa.yaml

telemetry:
  metrics:
    interval: 15000 # collection and export period, milliseconds
    exporters:
      otlp:
        endpoint: http://prometheus:9090/api/v1/otlp # POSTs to {endpoint}/v1/metrics
```

## The metric set

Durations are seconds (`unit: 's'`), converted from the milliseconds a span carries, so that
Grafana's units and Prometheus' conventions work unconfigured.

A name says what is measured and the type says how, so `.duration` is not redundant with
`histogram`: `toa.convergence.lag` is a histogram and is not a duration, and `toa.operation` alone
would not say whether it is the latency, the count or the size of something. Prometheus' OTLP
receiver appends the unit, so the series is `toa_operation_duration_seconds` either way; and a
metric that is also a prefix of another — `toa.operation` beside `toa.operation.errors` — is what
semantic conventions tell you not to write.

Names are the project's own, not the OpenTelemetry semantic conventions. Span _attributes_ stay
semconv, because Tempo's service graphs read them by name
([`tempo.yaml`](/observability/tempo.yaml) lists `messaging.destination.name` and `db.namespace`); a
metric has no such contract to keep, and `toa.exposition.request.duration` says what a Toa
deployment has where `http.server.request.duration` says what any process might.

### How it is recorded

Two ways, and which one a metric uses follows from whether it has a task to wrap.

**From a span, where one already brackets the work.** `SpanOptions` gains an optional `measure` —
the instrument and the fixed labels for that site. A span without it behaves exactly as it does
today, including the early return on an unsampled trace
([`Console.ts:52`](/libraries/openspan/source/Console.ts)); a span with it is measured whether or not
the trace is recorded. Every such site already memoizes its span options, so `measure` is memoized
with them: no object is built and no label is formatted per invocation.

**Explicitly, where there is no task.** A gauge read at collection, a counter incremented on an
event the code already handles.

A histogram is `buckets + 2` series per label combination, so one is declared only where the
distribution is read; a counter and a gauge are one series each and are the default.

### Core

| metric                       | type           | labels                                      | site                                                                                 |
| ---------------------------- | -------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `toa.operation.duration`     | histogram, `s` | `component`, `operation`                    | the span in [`component.ts`](/runtime/core/source/component.ts), `kind === 'server'` |
| `toa.operation.errors`       | counter        | `component`, `operation`, `code`            | `reply.error` at the same site                                                       |
| `toa.operation.exceptions`   | counter        | `component`, `operation`, `code`, `outcome` | `reply.exception` at the same site                                                   |
| `toa.operation.inflight`     | gauge          | `component`                                 | around `#process`                                                                    |
| `toa.call.duration`          | histogram, `s` | `component`, `operation`                    | the same span, `kind === 'client'`                                                   |
| `toa.call.exceptions`        | counter        | `component`, `operation`, `code`            | `#transmit` in [`call.ts`](/runtime/core/source/call.ts)                             |
| `toa.call.inflight`          | gauge          | `component`                                 | the same site                                                                        |
| `toa.event.publish.duration` | histogram, `s` | `event`                                     | [`event.ts`](/runtime/core/source/event.ts)                                          |

**A call and an invocation are two metrics, not one metric with a `kind` label.** `Remote extends
Component` with `kind = 'client'` and both go through the same `#process`, naming the same endpoint
of the same callee — so one `kind` label would put two different quantities under one name and count
every remote call twice, once in each process. The code has met this before: hops are counted only
when `kind === 'server'` because _"a `Remote` is a component too and names the very endpoint this
one does"_ ([`component.ts`](/runtime/core/source/component.ts)).

So `toa.operation.duration` is the callee doing its own work, with no transport in it, and
`toa.call.duration` is the caller's round trip, with the transport in it. Their difference across
the two services is the transport latency — what the readme already says about the `client`/`server`
span pair, now as a number to alert on. Summing either alone is a rate that means something; summing
both is not a rate at all.

**An operation has three outcomes, and two of them are counted.** `Reply` is
`{output, error, exception}`, and [`exceptions.md`](/documentation/exceptions.md) keeps the two
apart everywhere that follows — a metric is one of those places.

- `toa.operation.errors` is the operation working. A rise in `INSUFFICIENT_FUNDS` is a question
  about the business, not about the system. Its `code` is bounded by the manifest, because a code
  the operation did not declare in `errors` is refused by the runtime before it reaches a caller.
- `toa.operation.exceptions` is the E of RED. Its `code` is core's, rendered through `names` so a
  legend reads `System` or `StateConcurrency` rather than `0` or `304`; whatever an algorithm threw
  arrives as `System`. Its `outcome` is `permanent` or `transient`, from `exceptions.permanent()`.

`outcome` is the label to alert on, ahead of `code`. It is what
[`verdict.js`](/connectors/bindings.amqp/source/verdict.js) consults to decide between retrying a
message and parking it, so the two values are two different incidents: transient means attempts
piling up and work redone, permanent means messages set aside and work dropped. It is derivable from
`code` and is still a label, because deriving it in a query means enumerating the permanent codes in
every alert — which goes stale the moment core adds one, exactly where `OUTCOME` makes sure the code
itself cannot. Each code has one outcome, so materializing it adds no series.

`toa.call.exceptions` counts **only what the transmission itself raised** — `Transmission`,
`Addressee`, `Abandoned`, `Endpoint` — and never one the callee sent back. A remote exception reaches
the caller too, so counting everything the caller sees would count the callee's failures a second
time, in a second service. The two are told apart structurally rather than by a list of codes: one
arrives as `reply.exception`, the other is thrown by `#transmit`. That leaves four or so codes, which
is why this one carries no `outcome`: the label earns its place where there are twenty codes, and
earns nothing where an operator reads the outcome off the code name. There is no `toa.call.errors`
either — a returned error passes back through the caller unchanged, and the callee has counted it.

**The two in-flight gauges are not the same number, and the gap between them is the point.**
`toa.operation.inflight` counts what is running now; `toa.call.inflight` counts callers waiting, and
a caller's slot is held for the whole round trip — time queued, time waiting for an addressee that
has not claimed its name yet (`Addressee` is `transient` exactly because the process comes back),
time spent on a delivery being made again. Callers blocked while the callees run nothing is work in
flight that nobody is working on, and neither gauge alone shows it.

`toa.operation.inflight` is also the saturation signal after loop delay — the one that says whether a
slow operation is slow or merely queued behind others. It lives in core rather than in the binding so
that it counts an invocation whatever brought it: a broker delivery, an HTTP request, a pulse.

The duration histogram observes every invocation, failures included, because `Console.span` completes
its span on both branches. So `_count` is the invocation rate rather than the success rate, nothing
in this change declares a call counter anywhere, and success is `_count` less the two counters.

**Left out.** **Processing an event**, because it is an operation invocation: the `process` span
wraps `this.#local.invoke(this.#endpoint, request)` in
[`receiver.ts`](/runtime/core/source/receiver.ts), the same call `component.ts` measures, and the two
intervals differ by a `try`/`catch`. What that loses is which event caused it, in the one case where
it differs — `receivers` are keyed by source and two may name the same operation — and that is a
question about one invocation rather than about a rate, which the trace answers.

A separate metric for the loop refusal — already
`toa.operation.exceptions{code="Loop", outcome="permanent"}`. The `once` dedup hit and miss —
diagnostic rather than alertable. Per-phase timing of `acquire`/`run`/`commit` — three more
histograms for a breakdown a trace gives exactly, for one invocation, which is how a breakdown is
read. A pending-lookups gauge in `discovery.ts` — zero whenever anything is right, and when it is
not, the repeating warning has already said so at length.

### Bindings (AMQP)

| metric                 | type    | labels                                  | site                                                                                                                       |
| ---------------------- | ------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `toa.amqp.published`   | counter | `topology` (`request`, `task`, `event`) | [`consumer.js`](/connectors/bindings.amqp/source/consumer.js), [`emitter.js`](/connectors/bindings.amqp/source/emitter.js) |
| `toa.amqp.diagnostics` | counter | `condition`, `shard`                    | `#diagnose` in [`communication.js`](/connectors/bindings.amqp/source/communication.js)                                     |

**`toa.amqp.published` counts publications only**, over the three topologies the runtime puts on a
broker: a request that waits for a reply, a task that nobody waits for, and an event. Consumption is
not counted here — an arriving message is an invocation and is `toa.operation.duration` — so there is
one direction in this metric and no ambiguity about which.

It is not a second copy of core's rates. Core cannot tell a task from a request: both go through
`Call.invoke` → `Transmission.request` and both land in `toa.call.duration`, where a task's
measurement is the enqueue rather than the work. And core has no `shard`, so nothing today says which
broker of a multi-broker deployment is carrying what.

**`toa.amqp.diagnostics`** takes the thirteen conditions `#diagnose` subscribes to and nothing else —
`lost`, `flow`, `discard`, `recover` and the rest. They are comq's conditions rather than Toa events,
which is why the metric does not use the word `event` for them. Thirteen values by a handful of
shards: the cheapest high-value metric in the change, since today every one of those conditions
reaches the log and nothing more.

**Left out.** An in-flight gauge from `#pending.size` — it counts invocations, not broker work, so it
belongs to core as `toa.operation.inflight`, where it also covers what arrives over HTTP or from a
pulse. A duration for a request or a reply — the caller's side is `toa.call.duration` and the
callee's is `toa.operation.duration`, and a third measurement of the same round trip would only
disagree with them. A counter for the task refusal in `producer.js` — it re-raises the operation's own
exception, so it is already `toa.operation.exceptions`, and that path is exactly what the `outcome`
label predicts.

### Storage (state)

| metric                       | type           | labels                                | site                                                                       |
| ---------------------------- | -------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| `toa.storage.query.duration` | histogram, `s` | `provider`, `collection`, `operation` | `command()` in [`storage.js`](/connectors/storages.mongodb/src/storage.js) |
| `toa.storage.conflicts`      | counter        | `provider`, `collection`              | the lost compare-and-swap in `set()`                                       |

One histogram, at the one place every query already passes through. Collections by driver methods is
the widest label product in a component, so this is the zone to watch if the series count ever
matters.

`provider` is which database it is — `mongodb` — so that a deployment running more than one can be
read a kind at a time. There is no `database` label: the database is the context, which the resource
already names. `provider` means the same word here as in the blob zone, the kind of backend, so a
reader moving between the two reads one vocabulary.

**`toa.storage.conflicts` is a lost compare-and-swap**, which is `set()` returning `false`. It is
counted here rather than in core, where the conflict is _decided_: `Transition.commit` either
retries it or raises `StateConcurrencyException`
([`transition.ts:64`](/runtime/core/source/transition.ts)), and the raising branch is
`toa.operation.exceptions{code="StateConcurrency"}` already. Only the retrying branch is invisible —
it succeeds — so the counter exists to see that half, and sees both.

Counting it in core instead would need the operation to know its own identity, which it does not:
`Operation` holds no locator and no endpoint name, and `Definition` is the manifest's declaration
rather than a place for one. It would also be the worse label, because contention is a property of
the record being fought over: `collection` says what is contended where `operation` would say only
who noticed.

The cost of putting it here is that every storage connector counts it for itself. That is real, and
it is what the label being right costs; there is one connector today.

**Left out.** A duplicate-key counter — it surfaces as `toa.operation.errors` or as
`toa.operation.exceptions{code="Duplicate"}` depending on what the operation does with it. A
connection-pool gauge: the driver emits pool events, but command monitoring is deliberately off and
reading the pool needs a listener nobody has attached yet — worth its own change, with the
measurement that justifies it.

### Atomicity

| metric                    | type           | labels  | site                                                                     |
| ------------------------- | -------------- | ------- | ------------------------------------------------------------------------ |
| `toa.atomicity.lock.wait` | histogram, `s` | `group` | around `redlock.using` in [`atom.js`](/connectors/atomicity/src/atom.js) |
| `toa.atomicity.locks`     | gauge          | `group` | locks this replica holds                                                 |

`lock()` waits for as long as it takes to acquire its keys. That wait is inside an operation, so today
it is indistinguishable from the operation being slow, and a replica starving on a lock another
replica will not release looks exactly like a busy component. This is the one place a histogram is
worth its fifteen series for a single label: the distribution is the signal, because a mean over
waits that are usually zero says nothing.

**Left out.** Anything about `meter()` — it is the mechanism under exposition throttling, and what an
operator asks is how often a request was throttled, which is an HTTP status and is counted there.

### Stash (Redis)

| metric                       | type           | labels    | site                                              |
| ---------------------------- | -------------- | --------- | ------------------------------------------------- |
| `toa.stash.command.duration` | histogram, `s` | `command` | [`Aspect.ts`](/extensions/stash/source/Aspect.ts) |

The hottest measured site in the change — the aspect proxies every Redis command — and still far
below what it measures. `command` rather than a key or a pattern: the commands a component uses are a
fixed set of its source, a key is not.

**Left out.** A pipeline batch-size histogram: `db.operation.batch.size` is on the span already, and a
distribution of batch sizes is a question about one component's code rather than about a deployment's
health.

### Cadence

Cadence does two things — a **pulse** calls an operation on a cadence, a **delay** hands one call over
to be made later — and each half has a way of quietly doing nothing.

| metric                   | type    | labels                                   | site                                                                    |
| ------------------------ | ------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `toa.cadence.pulses`     | counter | `pulse`                                  | `fire()` in [`Pulse.ts`](/extensions/cadence/source/Pulse.ts)           |
| `toa.cadence.skipped`    | counter | `pulse`, `reason` (`overlap`, `unowned`) | the same file                                                           |
| `toa.cadence.delayed`    | counter | `component`                              | [`Aspect.ts`](/extensions/cadence/source/Aspect.ts)                     |
| `toa.cadence.dispatched` | counter | `component`                              | the scan in [`Dispatcher.ts`](/extensions/cadence/source/Dispatcher.ts) |
| `toa.cadence.expired`    | counter | `component`                              | the same scan, a row past its `overdue`                                 |
| `toa.cadence.scans`      | counter | `outcome` (`done`, `skipped`, `failed`)  | `tick()` in the same file                                               |

**`pulses` is the numerator against a rate the manifest already fixes.** The gap between calls is
`cycle / intervals`, so the expected rate is known without asking anything, and the readme's own list
of what to expect — _"a rollout, a crash, or an operation that raised or ran past its own interval
each cost that interval, and nothing makes it up afterwards"_ — is a list of ways that numerator
silently falls below it. `skipped` names the two the runtime can see; `pulses` against the manifest's
rate catches the rest, including the ones nothing logs at all.

**`delayed` against `dispatched` is work handed over and not done.** A delayed call is made once and
waits for a target that may not be there to take it, and a row past its `overdue` is never made at
all — so `expired` counts lost work outright, and the residue `delayed − dispatched − expired` is what
is still waiting.

**`scans` counts the pass itself**, because the dispatcher has a failure its own comment names: _"a
pass that outlives its interval takes every pass after it with it, and nothing is dispatched at all
while that lasts. Silently, it is a dispatcher that stops dispatching in a deployment that ran for
months."_ It is logged, and a log line is what a deployment of months is made of. This is a different
skip from the pulse's: one is a component not being called, the other is nothing being called.

**Left out.** A pulse duration — a pulse fires an operation, and that is `toa.operation.duration`. A
tick-lateness histogram — `scans{outcome="skipped"}` is the outcome, and the lateness of one pass is a
trace question.

### Outbox

| metric                  | type       | labels        | site                                                                        |
| ----------------------- | ---------- | ------------- | --------------------------------------------------------------------------- |
| `toa.outbox.pending`    | gauge      | `destination` | `#publishing`/`#published` in [`outbox.ts`](/runtime/core/source/outbox.ts) |
| `toa.outbox.age`        | gauge, `s` | `destination` | the oldest unpublished row read by `#pump`                                  |
| `toa.outbox.failures`   | counter    | `destination` | the publication failure in `#send`                                          |
| `toa.outbox.unassigned` | gauge      | —             | `#unassigned` in `#assignment`                                              |

The zone with the most to gain, because the pump swallows a publication failure and logs it — events
stop leaving and nothing says so.

**`age` is the only outbox number with a threshold a person can choose.** What you do with it is write
one alert: _events from this destination are more than N seconds behind_, where N is a sentence the
business can say out loud. `pending` has no such number — is thirty rows bad? at what traffic? — while
`age` is the same question at every scale: a handful of rows four hours old is a stuck destination, a
thousand rows a second old is a busy one. It is also the one symptom every cause shares: a pump that
stopped, a broker refusing, lanes nobody owns, all read as `age` rising. It costs no query of its own,
because `#pump` already reads pages of unpublished rows.

**`unassigned` is cycles in a row this replica was given no lane**, and what that means is in the
code's own words: _"this outbox recovers nothing: a publication that failed is never retried, and that
change is lost with the process that failed to make it."_ Owning no lane for a moment is ordinary — a
replica that just started has not been told yet — so the code picks ten consecutive cycles as the
point where it stops being ordinary, which is the threshold the alert uses too. It is a degraded state
that keeps running and fails nothing visibly.

### Exposition

| metric                            | type           | labels                      | site                                                                         |
| --------------------------------- | -------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `toa.exposition.request.duration` | histogram, `s` | `method`, `route`           | the span in [`HTTP/Server.ts`](/extensions/exposition/source/HTTP/Server.ts) |
| `toa.exposition.responses`        | counter        | `method`, `route`, `status` | the success and failure handlers there                                       |

**`status` is on the counter and not on the histogram**, the one place in this change where cost
changes a label set rather than a metric. This is the widest product in the deployment — routes by
methods by statuses — and multiplying it by fifteen bucket series is what would make the gateway
expensive. Latency per route and per method is read; latency per status almost never is, while the
count per status is read constantly.

`route` is the template and needs new plumbing: the span name is `${method} ${url}`, which is
unbounded — fine for a trace and fatal for a series. `RTD/Node` gains a route template computed when
the tree is built (the prefix is already assembled by `Route.walk`), stamped on the context in
`Gateway.match`. A request that matched nothing is `none`, which keeps a 404 flood from becoming a
cardinality incident.

**Left out.** **An authorization counter.** Authorization directives _grant_: they run in order
_"until one of them grants access... If none of the directives grants access, then the Authorization
interrupts"_ ([`access.md`](/extensions/exposition/documentation/access.md)). A refusal is therefore
the absence of a grant and belongs to no directive, so there is nothing to label it with — and with no
label it counts what `responses{route, status="401"}` counts already. The same is true of throttling,
which is `status="429"`. The question the label was meant to answer — whether a principal was refused
for who they are or for what they asked — is about one request and belongs to a log line with a
`trace_id` on it rather than to a series that lives forever.

Per-directive timing — five spans a request and five histograms for a breakdown the trace already
gives.

### Fetch

| metric                | type           | labels                       | site                                                                        |
| --------------------- | -------------- | ---------------------------- | --------------------------------------------------------------------------- |
| `toa.fetch.duration`  | histogram, `s` | `origin`, `method`           | the attempt span in [`fetch/Aspect.ts`](/extensions/fetch/source/Aspect.ts) |
| `toa.fetch.responses` | counter        | `origin`, `method`, `status` | the same site                                                               |
| `toa.fetch.retries`   | counter        | `origin`                     | the same site                                                               |

`origin` is bounded by the fetch allowlist, the secure-by-default enumeration an application already
writes — so the one label that would otherwise be unbounded is bounded by a constraint that exists for
another reason entirely. `status` is split off the histogram by the same rule as in exposition.

The attempt is measured and its parent is not: an attempt is a real HTTP request, the parent is the
policy around it, and `retries` is what says the difference — a rising retry count against a flat
response count is an origin degrading before it fails.

### Blob storages

| metric                        | type           | labels                             | site                                                            |
| ----------------------------- | -------------- | ---------------------------------- | --------------------------------------------------------------- |
| `toa.blob.operation.duration` | histogram, `s` | `storage`, `provider`, `operation` | [`storages/Storage.ts`](/extensions/storages/source/Storage.ts) |

Network I/O to a third party, not an invocation, and nothing else reports it. Four operations by a
handful of storages is a small product.

`storage` is the name the component declared it under — `storages: tmp` is `tmp` — and `provider` is
what stands behind it. A component declares several and uses them for different things, so which one
was slow is the question, and the provider alone does not answer it where two declarations share one.
Both are already on the `Storage` the factory builds
([`Factory.ts:51`](/extensions/storages/source/Factory.ts)).

Named `blob` rather than `storages`: the extension calls itself BLOB storage, and
`toa_storages_operation_duration_seconds` beside `toa_storage_query_duration_seconds` is a one-letter
difference on a dashboard, which is not a name.

### Convergence

| metric                     | type           | labels                                   | site                                                                               |
| -------------------------- | -------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `toa.convergence.lag`      | histogram, `s` | `region`, `outcome` (`applied`, `stale`) | the merge in [`convergence/Storage.ts`](/extensions/convergence/source/Storage.ts) |
| `toa.convergence.backward` | counter        | `region`                                 | the same merge, where the lag came out negative                                    |

This is the gap [`convergence.md`](/discussions/convergence.md) named — _"alerting on it would need a
metrics facility that does not exist here."_ `outcome` is what separates convergence healthily
dropping duplicates from convergence dropping everything.

**The number does not exist yet.** What goes on the wire today is `Message { record, trace? }` and
there is no send timestamp on it, so computing the lag is part of this zone's work — and it is one
subtraction across two clocks with the skew ignored. There is no way to do it that is not.

**Taken from the record, not from the send.** The record travels as it stands, _"its version, its
timestamps, its region and all"_, so the receiver subtracts the record's own update timestamp — set by
the clock of the region that wrote it — from its own `Date.now()`. That needs no new field on the
wire, so there is no version skew between regions to manage, and it measures what people actually ask
about: how stale this region's copy is relative to when the write happened, rather than how long one
hop took.

Two rules follow, and both belong in the documentation beside the metric:

- **A negative lag is clamped to zero and counted.** The receiver's clock can be behind the writer's,
  and a histogram has nowhere to put a negative observation; clamping silently would turn the low
  buckets into a clock report. `toa.convergence.backward` measures skew, and reading it is how you
  know whether the lag is worth reading.
- **An alert threshold sits well above the worst expected skew.** The order of magnitude is already
  fixed: _"a lag of hundreds of milliseconds read against a skew of a few is worth reading; nothing
  precise should be built on it."_ A drifting clock shifts the whole distribution, so a threshold near
  the skew pages on NTP rather than on convergence.

**Left out.** A send and a deliver duration — the producer/consumer pair already becomes a
service-graph edge in Tempo with a rate and a duration each, derived from sampled spans, which for an
edge is enough. The lag is the one thing that is not.

### Realtime

| metric                  | type    | labels  | site                                                                    |
| ----------------------- | ------- | ------- | ----------------------------------------------------------------------- |
| `toa.realtime.pushed`   | counter | `event` | `deliver()` in [`Realtime.ts`](/extensions/realtime/source/Realtime.ts) |
| `toa.realtime.failures` | counter | `event` | the `catch` in `push()`                                                 |

**`pushed` is per event, which is the whole reason it exists.** `deliver` calls
`streams.invoke('push', …)`, so the call is already counted as
`toa.call.duration{component="…streams", operation="push"}` — but labelled by component and operation,
where the event is the input and invisible. Here it is the label, and that is what makes the useful
comparison possible: `toa.event.publish.duration._count{event}` against `toa.realtime.pushed{event}`
is published versus arrived, and a gap between them is events that never reached realtime at all.

`failures` is the other half, and today a push failure is swallowed into a log line and nothing else.

**Left out.** **Delivered to clients**, which would be the best number here and is not this
extension's to count: `push` hands the event to the streams component, and the fan-out to connected
sockets happens there. Counting it needs an instrument in that component. Connected-client and
stream-count gauges are the same story.

### Process

| metric                   | type       | labels                                  | site                                                   |
| ------------------------ | ---------- | --------------------------------------- | ------------------------------------------------------ |
| `toa.process.loop.delay` | gauge, `s` | `quantile` (`p50`, `p90`, `p99`, `max`) | `perf_hooks.monitorEventLoopDelay`, read at collection |
| `toa.process.memory`     | gauge      | `kind` (`rss`, `heap`, `external`)      | `process.memoryUsage()` at collection                  |

**These two live in `openspan`, not in the extension or in core.** They are about the process, and the
gateway is a process that boots without the telemetry extension — which is why
[`service.ts`](/extensions/exposition/source/service.ts) duplicates the configuration at all. Putting
them in the extension would leave them out of the one process where loop delay matters most.
`openspan` already owns the collection loop, so both are read there, once per interval, by whatever
process called `metrics()`.

`openspan` is not Toa's and cannot name a series `toa.*` on its own, the same boundary that already
makes the extension inject `service` — so the names of these two are given to it rather than built
into it.

Loop delay is the one saturation signal Node gives and nothing in Toa reports it today. It is a
gauge of quantiles and still has no blind spot, because `monitorEventLoopDelay` keeps its own
histogram between reads: what the gauge carries is the whole interval rather than the moment it was
read, and the monitor is reset once it has been. Recording its quantiles as observations of a
histogram of ours would have been the obvious thing and is wrong — it invents a distribution whose
count is the number of quantiles rather than the number of loop turns. Memory is three series and
is the first thing anyone looks at.

### Configuration and introspection

Nothing. A configuration fetch that fails blocks the boot, which the readiness probe already reports
as a process that never became ready, and introspection is read by people rather than run in a loop.

### What it costs

**With no exporter configured: nothing.** `measuring()` is one boolean check, the same shape as
`recording()`, and a span whose site carries no `measure` keeps today's code path byte for byte.

**Per measured call:** two `performance.now()` reads, a lookup of the series by its label values, and
an increment of a counter plus a bucket. Tens of nanoseconds either way. Every span-measured site
brackets something already doing I/O — a broker round trip, a Mongo query, a Redis command, an HTTP
request, a call to a third party — so the measurement is orders of magnitude below what it measures.
The hottest is the stash aspect, which proxies every Redis command, and a Redis round trip is still
four orders of magnitude more than recording its duration.

**Per process, in memory:** low hundreds of label combinations in a component, low thousands in the
gateway. A histogram is one object holding an array of bucket counters, so a few hundred combinations
are tens of kilobytes.

**In the backend it is fifteen times that.** A histogram becomes `_bucket` per edge plus `+Inf`,
`_sum` and `_count` — twelve edges are fifteen Prometheus series per combination. Three hundred
combinations in the gateway are some 4,500 series, not 300. That multiplier, not the process memory,
is what a metrics bill is made of: Prometheus' memory is roughly linear in active series, and managed
backends price on series or on the samples series produce.

What none of it scales with is traffic. Samples per series are set by `interval`, so ten requests a
second and ten thousand cost the same — which is why bucket count and label cardinality are the two
numbers to watch, and why a histogram is worth declaring only where the distribution is read.

And a series that stops being written keeps costing: it leaves the active set after five minutes but
stays in the block index and on disk for the whole retention. So an unbounded label does not produce a
large number of series, it produces a growing one — the reason values are enumerated in the manifest
rather than trusted to the data.

**On the wire:** one POST per `interval` carrying the full cumulative state, on the same
suspend-and-drop contract as spans. Traffic does not change its size; only the number of series does.

### What cannot be seen

Two resolutions follow from the design, and they are not the same thing.

**In time: `interval`.** One collection per interval is one sample per series, so nothing is readable
at a finer grain. What it costs differs by type, and this is the part worth knowing before declaring
one:

- A **counter** loses nothing. Every increment between collections is in the next value; what is lost
  is only _when inside the interval_ it happened.
- A **histogram** likewise: no measurement is dropped, only its position in time.
- A **gauge** loses the value itself. A level that rose and fell between two collections was never
  recorded — the last write before a collection is the only thing exported. This is a blind spot, not
  a resolution, and it is why `toa.process.loop.delay` is a histogram fed by `monitorEventLoopDelay`,
  which accumulates between reads, while `toa.operation.inflight` is a gauge and a burst inside an
  interval will not appear.

A practical consequence for whoever writes the alert: a `rate()` window shorter than about four
intervals — a minute at the default — has too few samples to be trusted.

**In value, for histograms: the buckets.** Fixed at declaration and independent of `interval`. A
quantile is interpolated inside a bucket, so nothing finer than an edge can be asked, and changing the
edges later starts the history over.

Neither is peculiar to Toa, and both change what someone writes, so the documentation states them
where the type is chosen.

## The changes, by area

### 1. `libraries/openspan`

- **`Transport.ts`** — extracted from `Otlp.ts`: the `node:http` request, the timeout, the
  suspend/cooldown, the warn-once, the `beforeExit` flush. `Otlp` uses it unchanged in behaviour, and
  its suite is the proof. Both signals then keep one contract for an absent backend, and `node:http`
  over `fetch` for the shutdown reason already documented there.
- **`Registry.ts`** — `counter`, `gauge`, `histogram`; cumulative; label keys declared at creation;
  gauges are callbacks run at collection. `collect()` returns a snapshot.
- **`metrics.ts`** — `metrics(options)`, mirroring `traces.ts`, plus `measuring()` mirroring
  `recording()`. `MetricsOptions` carries `interval` and `exporters`.
- **`OtlpMetrics.ts`** — the OTLP/HTTP metrics exporter on the shared transport: `resourceMetrics`,
  `sum` (cumulative, monotonic), `histogram`, `gauge`, `startTimeUnixNano` fixed at process start.
  Named for the signal it carries rather than `Metrics`, which on a case-insensitive filesystem is
  the same file as `metrics.ts`.
- **`Console.ts`** — `SpanOptions.measure`, and the restructure that makes measurement unsampled:
  today the method returns early when the parent is unsampled; with `measure` set it times the task
  anyway and completes the span only when sampled. A span with no `measure` keeps today's fast path
  exactly.
- The process instruments, read at collection.

### 2. Configuration

- `TOA_TELEMETRY_METRICS` in [`const.ts`](/definitions/source/extensions.telemetry/const.ts).
- `addMetricsVariables` in [`deployment.ts`](/definitions/source/extensions.telemetry/deployment.ts),
  in the shape of `addTracesVariables`: `interval` positive, `otlp.endpoint` required.
- [`extension.ts`](/extensions/telemetry/source/extension.ts) reads it and calls `metrics()`, naming
  `service.instance.id` from `HOSTNAME` — the pod name under Kubernetes — falling back to
  `${hostname()}:${pid}`, the same shape as the `TOA_CONTEXT` injection beside it. Without a unique
  instance id, replicas' cumulative counters collide.
- The gateway's copy in [`service.ts`](/extensions/exposition/source/service.ts).

### 3. A code for a misuse

[`exceptions.ts`](/runtime/core/source/exceptions.ts) gains one code, general the way the five
already there are:

```ts
/** a component asked for something its manifest does not declare */
Misuse: 600
```

with `MisuseException` from `derive()` and `'permanent'` in `OUTCOME` — _what a component did not
declare, it does not declare on the next attempt either_. `600` opens a new series after
`Contract: 200`, `State: 300`, `Communication: 400` and `Loop: 500`; like `Loop` it has one member
today, which is its own base.

**The code says nothing about metrics.** Core does not know its extensions, and `Contract`, `State`,
`Communication` and `Loop` are all names of what core itself does; an `UndeclaredMetric` in that list
would be core carrying a word from `extensions.telemetry`. What core provides is the general code and
its classification, and the extension puts the particulars in the message:

```ts
throw new MisuseException(`Metric '${name}' is not declared`)
```

Two things follow on their own. `OUTCOME` is typed `Record<keyof typeof codes, …>`, so the
classification cannot be forgotten — it will not compile until the new code says which it is. And
`names` is `swap(codes)`, so `verdict.js` names the parked message without another edit.

### 4. The manifest declaration and the userland aspect

`extensions.telemetry` has no `manifest` export today — it is configured entirely by Context
Annotation. It gains one, in the shape of
[`extensions.cadence`](/definitions/source/extensions.cadence/manifest.ts), which is the working
precedent for a component-manifest block that norm validates at read time:

- `definitions/source/extensions.telemetry/schemas.ts` and `schemas/extensions.telemetry/*.cos.yaml`
  — the declaration schema.
- `definitions/source/extensions.telemetry/manifest.ts` — validates the `telemetry.metrics` block:
  instrument names are identifiers, `type` is one of the three, `buckets` ascend, an enumeration is a
  non-empty list of scalars, and `UNDECLARED` is not one of its values. Telemetry is in `PREDEFINED`,
  so every component gets a declaration whether or not it writes one; an absent block normalizes to
  `{}` and contributes no aspect.
- `definitions/source/extensions.telemetry/types.ts` — the `Declaration` type, shared by the manifest,
  the aspect and the documentation.

The aspect, `extensions/telemetry/source/Metrics.ts`, is a `Connector` implementing
`extensions.Aspect` in the shape of [`Span.ts`](/extensions/telemetry/source/Span.ts): it builds one
instrument per declared name at construction — not per call — and exports them by name. Series names
are prefixed with the component id, so two components cannot collide and the manifest name stays
short.

Nothing in the boot changes for this. The contract is already `aspect(locator, declaration)` and
`aspects.js` already passes the declaration; telemetry's `Factory.aspect` simply ignores the second
argument today, because it has never had a manifest block to read.

### 5. The dev stack

- `--web.enable-otlp-receiver` on `prometheus` in [`docker-compose.yaml`](/docker-compose.yaml). No new
  port: Prometheus ingests OTLP on `31070` at `/api/v1/otlp/v1/metrics`, so the port table in
  `CONTRIBUTING.md` is unchanged.
- `observability/dashboards/` gains a RED dashboard beside `service-graph.json`.
- The exposition suite's `Parameters.ts` points metrics at `http://localhost:31070/api/v1/otlp` as it
  already points traces at Tempo.

### 6. Documentation

- **`documentation/metrics.md`, a new page.** How to declare a metric and what each type is for; what
  a gauge cannot show between two collections; what `UNDECLARED` means; what sampling does and does
  not do to a metric; and **every metric the runtime records, by zone, as the tables above have them**
  — name, type, labels — so that a reader of a dashboard can find what a series is without reading the
  source. Facts only: the reasoning for what each metric includes and excludes stays in this
  discussion.

  Beside the declaration, where labels and buckets are chosen, three sentences on what a metrics
  backend charges for, because it is not what an author expects: a label value, not a measurement.
  Traffic is free — a series costs the same at ten requests a second and at ten thousand — while every
  label combination is a series, every histogram bucket is a series of its own, and a series that
  stops being written still occupies the retention. Linked out for the rest, to Prometheus'
  [Do not overuse labels](https://prometheus.io/docs/practices/instrumentation/#do-not-overuse-labels)
  and [Histograms and summaries](https://prometheus.io/docs/practices/histograms/).

- `extensions/telemetry/readme.md` — a `## Metrics` section: the annotation, and a pointer to
  `documentation/metrics.md` for the set and the declaration.
- `extensions/telemetry/grafana.md` — the Prometheus wiring, local and production.
- `libraries/openspan/readme.md` — the `metrics()` and `Registry` API.
- Three corrections this change found on its way through: the telemetry readme puts the gateway probe
  on `8000` where it is `8004`; the MongoDB storage readme credits driver command monitoring that
  `client.js` deliberately disables; and the comment in `service.ts` that explains why the gateway
  copies the telemetry configuration should name metrics alongside traces.

## Decisions

**One backend holds several products, and what separates them is the resource, not the name.** The
alternative was to prefix a metric with the context name, and it inverts what the prefix is for:
`orders_operation_duration_seconds` beside `billing_operation_duration_seconds` are two metrics, and
no dashboard and no alerting rule can be written once and used for both. `toa.` is a prefix
precisely because the metric is the same metric in every Toa deployment.

Products separate where OpenTelemetry puts them, in resource attributes: `service.namespace` is the
context (`TOA_CONTEXT`), `service.name` the process, `service.instance.id` the replica, and
`deployment.environment.name` the environment (`TOA_ENV`). Prometheus joins the first two into `job`
and the third into `instance`, so one dashboard filters by `job` and stays one dashboard.

**No console exporter for this signal, though traces have one.** A span is an event and reads as a
line: a name, a duration, a parent. A cumulative counter is state, and a line of it says neither a
rate nor a comparison — what it does say, it says again on every collection, so a local run drowns
in the series it holds rather than learning anything. The span exporter also has a user this one
would not: `TOA_BOOT_TRACE=1` makes `toa compose` and `toa serve` print a boot-time breakdown
([`compose.js:43`](/runtime/cli/src/handlers/compose.js)), which has no backend in the picture by
design.

What replaces it is the annotation being declared without an exporter, which records and posts
nothing. That is what the feature suite runs under, and it costs no timer.

**Push, not scrape.** A pull endpoint means a listener per process, pod scrape annotations in the
chart, and the port contention `Ready.ts` already documents for a local multi-process run. Pushing
reuses the transport, the annotation shape and the absent-backend contract `Otlp` already has.

**Off until an exporter is configured**, like traces — there is nowhere to send a series otherwise,
and `measuring()` then costs one boolean check on the hot path.

**A userland metric is declared in the manifest, not created at a call site.** A `counter(name,
labels)` API is what every metrics library offers and it is what makes every cardinality incident: the
label values are whatever the code passed, and nothing between the author and the backend reads them.
Declaring the instrument puts the series under the same rule as everything else the runtime accepts —
enumerated in configuration, validated by `toa`, and an empty enumeration admitting nothing. It costs
the author a manifest edit to add a metric, which is the right price.

**A misused name throws, a misused value does not.** An instrument name is a literal in the source: it
is wrong on every invocation of that path, nothing can make it right, and that is what
`exceptions.md` calls an exception. A label value comes from data that outlived the manifest, so
failing the invocation over it would be the system breaking because the world changed.

Throwing is only safe because the code is classified `permanent`: `verdict.js` parks the message on
its first delivery under the code's name instead of retrying a fault no attempt can clear. An
unclassified throw — a `TypeError` from a missing property, which is what the obvious implementation
gives — would be treated as transient and retried with a growing wait for minutes before parking, over
a typo.

**The warning about an unenumerated value is once per label, not once per value.** Per value is the
obvious reading of "once" and it is a leak: the set of values to remember is the set the data
produces, which is the very thing the enumeration exists to stop from reaching memory. Warning every
time floods the log from a hot path instead. Keying it on the label makes what is remembered a
property of the manifest — one boolean per declared label, allocated when the instrument is built.
Writing nothing and leaving it to the `UNDECLARED` series was the third option: it shows that values
are being refused and never which, so nothing can be done about it.

**`UNDECLARED`, uppercase, rather than `other`.** A legend has to distinguish it from a value the
component really has, and a channel named `other` is entirely plausible. It is also the same word the
undeclared instrument uses, for the same kind of mistake: one about a name, one about a value.

**Metrics are named in the project's vocabulary, spans keep semconv attributes.** A span attribute is
read by name by something outside Toa — `tempo.yaml` keys service graphs off
`messaging.destination.name` and `db.namespace` — so those stay. A metric has no such reader, and
naming it `http.server.request.duration` describes a generic HTTP server where
`toa.exposition.request.duration` describes the thing an operator is looking at.

**The runtime's metric set is fixed, with no switch per source.** The span-measured sites are the
runtime's own and no manifest reaches them, so the alternative was an enumeration in the annotation —
groups an application lists to admit. It is buildable: the sites are in different packages but they
all resolve `measure` through the one registry in `openspan`, so the gate lives there and no call site
learns about configuration. It is not built because the thing it saves is pennies — tens of
nanoseconds a call, on sites already doing I/O, and a few hundred series that do not grow with
traffic. A setting nobody turns still costs a schema, a validation, a scenario and a paragraph. The
exporter is the switch that matters. If a source ever proves expensive — stash is the only candidate,
proxying every Redis command — that is when to add the knob, with the numbers that justify it.

## Context

The runtime is already instrumented for distributed tracing, broadly: operations, HTTP, directives,
MongoDB, Redis, object storage, events, cadence, convergence, realtime, fetch, and boot. Sampling is
head-based and propagated, spans go out over OTLP/HTTP, and the export path is careful where it needs
to be — `node:http` over `fetch` so an unroutable endpoint cannot delay shutdown, warn-once and
cooldown so a missing backend costs nothing.

What it has no facility for is metrics, and [`convergence.md`](/discussions/convergence.md) is where
that was first written down: _"Toa has no metrics API — `extensions.telemetry` is logs and traces"_,
and, of the lag between regions, _"alerting on it would need a metrics facility that does not exist
here."_ That discussion settled for what spans could give and named what they could not. This one
builds the facility.

## What happens today

Every series a Toa deployment has is derived by Tempo's `metrics_generator` from the spans that reach
it ([`tempo.yaml`](/observability/tempo.yaml)), and `prometheus` in the compose file is a remote-write
sink rather than a scraper. Three things follow.

**The counts are not true.** Sampling is decided at the trace root and an unsampled trace creates no
spans at all, so `traces_spanmetrics_calls_total` at `sample: 0.1` is a tenth of the traffic — and the
`rate` token bucket undersamples a spike harder than a lull, so it cannot even be scaled back up. A
request rate and an error rate that move with the sample rate are not something to alert on.

**A gauge has no span.** Outbox backlog, callers in flight, a lost broker shard, event-loop delay, a
cadence tick skipped — none is a task with a duration, so none is visible at any sample rate. These
are where the silent failures live: the outbox pump swallows a publication failure and logs it, and
`#diagnose` names thirteen broker conditions that reach the log and nothing else.

**Some numbers are nobody's.** The lag between regions, the wait on a distributed lock, the gap
between events published and events that reached realtime — each is computable and none is computed.

## Stages

Each is one unit of work: scenarios first, each failing for the reason expected.

1. **This discussion and the documentation.** Draft pull request into `dev`. No code.
2. **`Transport.ts`.** Pure refactor; `Otlp.test.ts` unchanged and green.
3. **Registry and console exporter.** Unit tests: declaration, cumulative accumulation, an undeclared
   label, histogram buckets, gauge callbacks, the snapshot at collection.
4. **`Metrics.ts`, the OTLP exporter.** Unit tests mirroring `Otlp.test.ts`: encoding, batching,
   grouping by resource, custom headers, timeout, drop-while-unavailable, warn-once, recovery.
5. **Configuration.** `TOA_TELEMETRY_METRICS`, `deployment.ts`, `extension.ts`, `service.ts`. Feature
   scenarios for annotation → environment, as the logs scenarios already do.
6. **The span tap.** `SpanOptions.measure` and the unsampled restructure of `Console.span`, with Core
   as the first zone to use it. Nothing else moves until this one is proven — every other
   span-measured zone is the same mechanism again.
7. **The remaining span-measured zones**, one unit each, cheapest plumbing first: storage, stash, blob
   storages, fetch, then exposition — exposition last because `route` needs a template on `RTD/Node`
   and nothing else in the change does.
8. **The explicit instruments**, one unit per zone: outbox, bindings, atomicity, cadence, convergence,
   realtime, process, `toa.operation.inflight` in core, and `toa.storage.conflicts` beside the
   storage histogram.
9. **The manifest declaration**, with the `Misuse` code in `@toa.io/core`.
10. **`context.metrics`.** The aspect, the type, the contribution.
11. **The dev stack and the dashboard.**

Stages 7 and 8 are independent of each other, and a zone within either is a unit that lands on its
own. If only some land, land 8 first: the explicit instruments are what catch a silent failure, while
7 adds resolution to failures already visible as a slow operation. Stage 9 lands before 10 — the
declaration is what the aspect is built from, and a manifest that `toa` already refuses is a better
failure than an aspect that refuses at boot.

## Verification

New scenarios in [`features/extensions/telemetry.feature`](/features/extensions/telemetry.feature),
in the shape of `Exporting traces over OTLP`:

- **A metric is recorded on an unsampled trace.** `telemetry.metrics` set, `traces.sample: 0`, invoke,
  and the operation duration series is present with count 1. This is the guarantee the whole change
  exists for.
- **Nothing is measured when no exporter is configured.** No `TOA_TELEMETRY_METRICS`, invoke, and no
  series exists.
- **Exporting metrics over OTLP**, pointed at `http://localhost:31070/api/v1/otlp` and read back from
  Prometheus.
- **A component records a metric it declares**, from a `telemetry.metrics` block in the `telemetry`
  test component's manifest.
- **An unenumerated label value is recorded under `UNDECLARED`**, and the operation still returns its
  reply.
- **An undeclared instrument raises `Misuse`**, and a receiver parks the message on its first delivery
  rather than retrying it.
- **A malformed declaration is refused when the manifest is read**, before anything connects.
- **Metrics annotations** and their validation, the deployment export, as the logs and traces
  scenarios do.
- Exposition: `route` is the template and not the URL for a parameterised path, and `none` for a path
  that matched nothing.

Unit suites beside each new module in `libraries/openspan/source/`, run by `npm run test:unit`, and a
`manifest.test.ts` beside the cadence one.

End to end, by hand: `docker compose up -d`, `npm run transpile`, `npm run features`, then invoke
against the dev stack and read the series in Prometheus and the RED dashboard in Grafana. A trace
explored from a spike on that dashboard is the proof the two signals are wired to the same thing.

Before the pull request is ready: `npm run typecheck`, `npm run lint`, `npm run test:unit`,
`npm run features`. `libraries/openspan` publishes standalone, so what it ships is read with
`npm pack --dry-run` — `files` is an allowlist and the new modules are published only once named
there.

## Compatibility

On the wire, nothing changes: metrics are a new export, `traces` is untouched, and no envelope field
is added.

In types, `SpanOptions.measure` is optional and `openspan`'s existing exports keep their signatures.

In the manifest, `telemetry:` is a new block on an extension already predefined for every component —
an absent block normalizes to `{}` and contributes no aspect, so no existing manifest changes meaning.

In behaviour, a deployment that annotates no `telemetry.metrics` is what it is today: no collection,
no export, no cost.

## References

- [OTLP/HTTP](https://opentelemetry.io/docs/specs/otlp/#otlphttp), the encoding both exporters use.
- [Prometheus OTLP receiver](https://prometheus.io/docs/guides/opentelemetry/), which appends units to
  metric names and maps `service.name` and `service.instance.id` to `job` and `instance`.
- [Do not overuse labels](https://prometheus.io/docs/practices/instrumentation/#do-not-overuse-labels)
  and [Histograms and summaries](https://prometheus.io/docs/practices/histograms/), the cardinality
  and bucket arithmetic the documentation links out to.
- [RED](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/) and
  [USE](https://www.brendangregg.com/usemethod.html), the two readings the set is arranged for.
