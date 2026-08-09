# MongoDB Storage

## Tracing

Commands are recorded as `client` spans within the trace of the current invocation,
using the [driver command monitoring events](https://www.mongodb.com/docs/drivers/node/current/monitoring/command-monitoring/).

Spans are named `{command} {collection}` and carry `db.*` attributes following the
[OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/database/mongodb/):
`db.system`, `db.namespace`, `db.collection.name`, `db.operation.name`.

Commands executed outside of a sampled trace context (e.g. index management on startup)
and internal driver commands (`hello`, `ping`, authentication) are not recorded.

Monitoring is client-side only and does not affect the MongoDB server. Span recording
adds no waiting to the query path: exporting is buffered and happens in the background.
