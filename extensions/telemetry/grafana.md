# Grafana stack setup

Toa-specific notes for wiring application traces into Tempo, Prometheus and Grafana.
Reference configuration: [`observability/`](../../observability) in the Toa repository.

## Local environment

The application environment needs:

- [Tempo](https://grafana.com/oss/tempo/) with OTLP/HTTP enabled (port `4318`)
  and Prometheus with `--web.enable-remote-write-receiver`
  (see [`tempo.yaml`](../../observability/tempo.yaml) for the metrics-generator wiring)
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
```

## Production

- Point `exporters.otlp.endpoint` at any OTLP/HTTP receiver (`/v1/traces` is appended).
  Use `headers` for authentication (e.g. Grafana Cloud `Authorization: Basic ...`).
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

## Trace to logs

Toa stamps `trace_id` and `span_id` into every log entry written within a span
(including unsampled traces), so once pod logs are shipped to Loki,
traces and logs link up with two datasource settings:

- Tempo datasource, *Trace to logs*: select the Loki datasource,
  set time shifts (e.g. `-5m`/`+5m`) and a custom query:

  ```logql
  {namespace="$NAMESPACE"} | json | trace_id = `${__span.traceId}`
  ```

  Append `` | span_id = `${__span.spanId}` `` to narrow down to a single span.
- Loki datasource, *Derived fields*: regex `"trace_id":"([0-9a-f]+)"`,
  query `${__value.raw}`, internal link to the Tempo datasource.

Logs of unsampled traces carry a `trace_id` that does not exist in Tempo.
