# Grafana stack setup

Toa-specific notes for wiring application traces and metrics into Tempo, Prometheus and Grafana.
Reference configuration: [`observability/`](../../observability) in the Toa repository.

## Local environment

The application environment needs:

- [Tempo](https://grafana.com/oss/tempo/) with OTLP/HTTP enabled (port `4318`)
  (see [`tempo.yaml`](../../observability/tempo.yaml) for the metrics-generator wiring)
- Prometheus with `--web.enable-remote-write-receiver`, which is where Tempo's generator
  writes, and `--web.enable-otlp-receiver`, which is where Toa posts its own metrics
- Grafana with a Prometheus datasource and a Tempo datasource
  with `serviceMap.datasourceUid` pointing at it
  (see [`grafana-datasources.yaml`](../../observability/grafana-datasources.yaml))

Enable the export in the application context:

```yaml
# context.toa.yaml

telemetry:
  traces:
    exporters:
      console: ~
      otlp:
        endpoint: http://localhost:4318
  metrics:
    exporters:
      otlp:
        endpoint: http://localhost:9090/api/v1/otlp
```

[`dashboards/toa.json`](../../observability/dashboards/toa.json) reads those metrics: operations,
exposition, the outbox, the broker, storage, what is in flight and the event loop.

## Production

- Point `traces.exporters.otlp.endpoint` at any OTLP/HTTP receiver (`/v1/traces` is appended),
  and `metrics.exporters.otlp.endpoint` at one that takes metrics (`/v1/metrics` is appended).
  Use `headers` for authentication (e.g. Grafana Cloud `Authorization: Basic ...`).
- Metrics carry the context as `service.namespace` and the environment as
  `deployment.environment.name`, so several products and several environments reaching one
  backend separate by `job` rather than by metric name.
- Skip the usual per-process `service.name` setup (`OTEL_SERVICE_NAME` and the like):
  Toa attributes spans to component ids (`default.orders`) or `exposition` automatically,
  even when multiple components run in a single process.
- For the service graph, enable the Tempo metrics-generator with `service-graphs`
  and `span-metrics` processors, and add `messaging.destination.name`
  to `peer_attributes` — event destinations then appear as virtual nodes
  between producers and consumers.
- Sampling is head-based and decided by Toa (see [Sampling](readme.md#sampling)),
  so no tail sampling is required on the collector side; `sample` and `rate`
  are the knobs controlling the exported volume.
- Spans are sent in batches (512 spans or every 5 seconds) and flushed on process exit;
  abrupt termination (`SIGKILL`) may lose the last batch.
- Metrics are cumulative, so a lost export costs resolution and not totals: the next one carries
  what the lost one would have.

## Trace to logs

Toa stamps `trace_id` and `span_id` into every log entry written within a span
(including unsampled traces), so once pod logs are shipped to Loki,
traces and logs link up with two datasource settings:

- Tempo datasource, _Trace to logs_: select the Loki datasource,
  set time shifts (e.g. `-5m`/`+5m`) and a custom query:

  ```logql
  {namespace="$NAMESPACE"} | json | trace_id = `${__span.traceId}`
  ```

  Append `` | span_id = `${__span.spanId}` `` to narrow down to a single span.

- Loki datasource, _Derived fields_: regex `"trace_id":"([0-9a-f]+)"`,
  query `${__value.raw}`, internal link to the Tempo datasource.

Logs of unsampled traces carry a `trace_id` that does not exist in Tempo.
