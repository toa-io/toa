# Logs

## Design concept

`openspan` gains log exporters, beside the span exporters and the meters it already has. An entry
a console writes is handed to a set of exporters instead of straight to a stream, and the JSON
line becomes one of them.

Two exporters, independent of each other. The console writes the line, and is on unless a
deployment says otherwise. `otlp` batches entries and posts them to an endpoint, and is off until
one is annotated. Configuring either says nothing about the other.

### Guarantees

**Truth**

1. Every entry a process writes is offered to every configured exporter — the channels
   (`info`, `warn`, …) and the span lines the console span exporter composes alike. There is one
   place an entry is built and one place it fans out from.
2. An entry carries to the backend what it carries to the line: the message as the record body,
   the attributes and the component context as record attributes, the severity, and the
   `trace_id`/`span_id` of the span in scope.
3. The severity threshold is the one the console already has, per component
   (`telemetry.logs.level` and its per-component overrides). What a process prints is what it
   exports.
4. A trace that was not sampled still stamps its id onto the entries written within it _(today)_,
   so an exported record may name a trace the trace backend never received.

**Export**

5. A missing or unavailable endpoint costs one warning and dropped records, never throughput and
   never the process: the request is bounded by a timeout, a failed batch is dropped rather than
   queued, and the exporter suspends itself for a cooldown. The same terms the span exporter
   keeps, through the same transport.
6. The warning an outage produces is itself an entry, and reaches the exporter that produced it.
   The suspension is what makes that terminate: an exporter that has just failed drops what it is
   handed, the report of the failure included.
7. Records are exported under one resource for the process — `service.name`,
   `service.namespace` and `deployment.environment.name` — the same attributes the series carry,
   so one backend holding several products and several environments separates them the same way
   whichever signal is read.
8. A process that configures nothing prints exactly as it did before, including what it writes
   before the telemetry extension is constructed.

**What is not promised**

9. Two identical messages written within the same millisecond in the same stream may reach the
   backend as one: an entry's time is millisecond-resolution, and a backend is free to treat a
   repeated timestamp and line as a duplicate.

### What a component author does differently

Nothing. `context.logs` is unchanged; where the records go is a property of the deployment.

```yaml
# context.toa.yaml

telemetry:
  logs:
    level: info
    exporters:
      otlp:
        endpoint: http://loki:3100/otlp
```

## The changes, by area

1. **`openspan`.** `sinks.ts` holds the exporter set (`logging`, `sinks`, `flushLogs`) and the
   built-in `consoleLogs`; `Console.write` builds the entry and fans out, and `Console.print`
   writes it to the console's own streams; `OtlpLogs.ts` batches and posts; `logs.ts` composes the
   set from a configuration; `shutdown.ts` sends what every signal holds.
2. **`definitions`.** `telemetry.logs.exporters` compiles into `TOA_TELEMETRY_LOGS`, validated
   where the traces and metrics endpoints are.
3. **`extensions/telemetry`, `extensions/exposition`.** Both construct the exporter from that
   variable and name the resource; the gateway names itself `exposition`, as it does for series.
4. **`runtime/cli`.** The two exit paths flush every signal rather than the spans alone.
5. **Development stack.** Loki on `31065`, a Grafana datasource, and the link from a record to its
   trace.
6. **Documentation.** `documentation/logs.md`, the telemetry readme, `grafana.md`, the `openspan`
   readme.

## Decisions

**The console is an exporter, and switchable.** It was the only destination, written inline. Made
one of the set, a deployment that ships records to a backend can stop writing lines that nothing
reads — and, because the two are independent, one that wants both says nothing at all.

**The console stays on by default.** A pod's stdout is read by more than the backend. Turning it
off is a thing a deployment says by name, so no annotation about exporting can silently cost
someone `kubectl logs`.

**One threshold for both.** The level gate runs before the entry is built, so an exporter never
sees what the console would not print. A second threshold would be a second place a missing record
can come from, and the level is already per component.

**One resource for the process, not one per component.** A span carries the service it belongs to,
because a gateway process emits spans for itself and for the components it fronts. An entry has no
such field; the component it came from is in its context, and travels as a record attribute. That
keeps the resource constant for the process and the request one `resourceLogs` group.

**Span lines are exported like any other entry.** The span console exporter is opted into
explicitly and only by `toa dev`, so the run that gets span lines in its backend asked for both.
Excluding them would mean a console method whose entries some exporters see and others do not.

**`flush()` keeps its meaning.** It is published API and flushes spans. `shutdown()` is the one
that means the process is leaving, and it flushes all three — which is also what the metrics
signal was missing, its `report()` having had no caller.

## What happens today

Entries are written as JSON lines to stdout and stderr and go nowhere else. Reaching a backend
takes an agent on the node that scrapes the pod's stdout, parses the line and ships it — the
arrangement `grafana.md` describes, and the reason the trace link is documented as a regular
expression over the raw line.

## Verification

1. Annotating `telemetry.logs.exporters.otlp.endpoint` compiles into `TOA_TELEMETRY_LOGS`, beside
   a per-component level override that is unaffected by it.
2. `telemetry.logs.exporters.console: false` compiles, and is what the exporter set reads.
3. An annotation with an exporter and no endpoint fails the deployment.
4. A component that logs through `context.logs` has its record in Loki, with the message as the
   line and the component, the operation, the attributes and the trace id beside it.
5. The console turned off writes nothing to the streams while the other exporter still receives.
6. An entry reaches every exporter, with the console that wrote it, and none below the level.
7. The OTLP exporter posts to `/v1/logs`, batches, numbers every severity, survives a
   serialization failure, drops while suspended, warns once per outage, and resumes.

## Compatibility

On the wire, additive: a deployment without the annotation exports nothing and prints what it
printed. `Console.print` is new and `Console.write` is private, so the console's public surface
only grows. `openspan`'s `flush()` is unchanged.

## References

- [OTLP logs data model](https://opentelemetry.io/docs/specs/otel/logs/data-model/)
- [OTLP/HTTP](https://opentelemetry.io/docs/specs/otlp/#otlphttp)
- [Loki OTLP ingestion](https://grafana.com/docs/loki/latest/send-data/otel/)
