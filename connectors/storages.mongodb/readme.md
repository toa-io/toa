# MongoDB Storage

## Tracing

Commands are recorded as `client` spans within the trace of the current invocation.

Spans are named `{command} {collection}` and carry `db.*` attributes following the
[OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/database/mongodb/):
`db.system`, `db.namespace`, `db.collection.name`, `db.operation.name`.

Commands executed outside of a sampled trace context (e.g. index management on startup)
and internal driver commands (`hello`, `ping`, authentication) are not recorded.

Monitoring is client-side only and does not affect the MongoDB server. Span recording
adds no waiting to the query path: exporting is buffered and happens in the background.

## Stream tokens

A [stream](/documentation/collections.md) ends with a token of changes where two things hold:

- **MongoDB runs as a replica set**, which it does wherever there is an outbox.
- **The collection keeps images** of what a record was before each change, which is how a change
  that takes an entry out of the collection is told from a change outside it. They cost a copy of every
  changed record for as long as the oplog holds it, so a collection keeps them only by a
  [migration](/documentation/component/declaration.md#migrations):

  ```yaml
  # migrations/0003-images.yaml
  - images: true
  ```

  `- images: false` stops keeping them, and a token issued before is then refused with `410`.

A token lasts as long as the oplog of the replica set holds the point it names — its window, which
the size of the oplog and the rate of writes decide.

A read from a token scans the oplog from the point it names: it costs what the whole replica set
wrote since, whatever of it concerns the collection.
