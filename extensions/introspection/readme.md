# Toa Introspection

Builds a map of an application: its components, and the connections between them.

The map has two halves. The **nodes** describe each component as its manifest declares it — entity,
operations with their input and output schemas, events, receivers. The **edges** are the connections
observed while the application runs — which operation calls which, which event reaches which
receiver, and which events are published, including those nobody listens to.

The extension participates in every composition. Nothing has to be declared to get a map.

## Configuration

Both levels of the annotation are optional. Everything below shows the defaults.

### Context

```yaml
# context.toa.yaml

introspection:
  samples: false      # capture the actual payloads of calls
  interval: 15        # how often a component reports, seconds
  threshold: 256      # report earlier once this many edges are pending
  resources:          # explorer pod limits
    cpu: [100m, 500m]
    memory: [128Mi, 256Mi]
```

To turn introspection off completely — no explorer, no collection:

```yaml
introspection: false
```

Introspection exposes the map over HTTP and therefore requires the
[exposition](../exposition) extension. An application that does not use exposition has to turn
introspection off.

### Component

```yaml
# manifest.toa.yaml

introspection:
  samples: false      # never capture this component's payloads
```

To keep a component off the map entirely:

```yaml
introspection: false
```

### Samples

A sample is the actual input of a call, kept on the edge. It is production data, so it is off by
default, and both the context and the component have to allow it — either can veto. A component that
handles personal data should opt out permanently in its own manifest.

Payloads of the `identity` namespace are never captured, keys that look like secrets are masked, and
oversized payloads are dropped.

## Reading the map

The map lives in two ordinary components, `introspection.nodes` and `introspection.edges`. Both
answer `enumerate` and `observe`, and both are exposed under the `system:introspection` role:

```
GET /introspection/nodes/
GET /introspection/nodes/:id
GET /introspection/edges/
GET /introspection/edges/:id
```

Records carry `_updated`, which is when the node or edge was last observed — that is how a component
that no longer exists is recognized.

## Resources

The explorer runs as the `introspection-explorer` service. It needs a database: the components use
the context's `mongodb` annotation like any other.
