# Toa Introspection

Introspection collects information about a product's topology and presents it as a graph of
components and their interactions.

The topology includes:

- components and their entities, operations, events, and receivers;
- declared event relations between components;
- calls observed between components and services at runtime.

This provides a single view of both the product's declared structure and the communication paths
that are exercised at runtime. The topology is available through a web UI and an HTTP API.

An observed call is recorded as the pair it connects and nothing else: what the call carried is
not collected, and nothing an application passes between its components reaches the topology.

Introspection is enabled by default for every component in a composition.

## Configuration

Configure Introspection in `context.toa.yaml`:

```yaml
introspection:
  interval: 300
  threshold: 1024
  ui: true
  halt: false
```

All properties are optional.

| Property    | Default | Description                                                                                   |
| ----------- | ------- | --------------------------------------------------------------------------------------------- |
| `interval`  | `300`   | Interval between topology updates, in seconds.                                                |
| `threshold` | `1024`  | Number of distinct observed interactions that triggers an update before the interval expires. |
| `ui`        | `true`  | Publishes the web UI.                                                                         |
| `halt`      | `false` | Accepts [halt](/documentation/halt.md) signals, which stop the whole deployment. `true`, or a pair of `[min, max]` bounds for what one may ask for: `duration` and `quiescence`, in seconds. |
| `resources` | —       | Resource requirements for the Introspection deployment.                                       |

Resource requirements can be declared specifically for Introspection:

```yaml
introspection:
  resources:
    cpu: [100m, 500m]
    memory: [128Mi, 256Mi]
```

If omitted, Introspection uses the context-level `resources` declaration. Set `resources: null` to
run without resource requirements.

Disable Introspection for the entire context:

```yaml
introspection: false
```

Introspection requires the [Exposition](../exposition) extension to publish its API. A context that
does not use Exposition must disable Introspection.

### Component configuration

Exclude a component from the topology in its `manifest.toa.yaml`:

```yaml
introspection: false
```

## Web UI

The web UI visualizes the product topology and is enabled by default. It is published at
`/.introspection/` on the hosts declared in the context:

```yaml
ingress:
  hosts:
    - api.example.com
```

Open the following URL after deploying the composition:

```text
https://api.example.com/.introspection/
```

The configured host must also be served by Exposition because the UI reads topology data from the
Introspection API on the same origin.

Access to topology data requires the `system:introspection` role. The UI page itself is public, but
it cannot display topology data without an authorized API session.

To collect topology data without publishing the UI:

```yaml
introspection:
  ui: false
```

## HTTP API

The topology is available through the following endpoints:

```text
GET /introspection/nodes/
GET /introspection/nodes/:id/
GET /introspection/edges/
GET /introspection/edges/:id/
```

Nodes describe components and their declared interfaces. Edges represent calls observed between
components or services. Both endpoint groups support listing all records and retrieving an
individual record by its identifier.

API access requires the `system:introspection` role.
