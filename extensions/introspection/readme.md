# Toa Introspection

Builds a map of an application: its components, and the connections between them.

The map has two halves. The **nodes** describe each component as its manifest declares it — entity,
operations with their input and output schemas, events it publishes, receivers and the event each of
them takes. This is the whole wiring of the application, and it is true before a single request is
served. The **edges** are the calls observed while it runs, each carrying the origin that caused
it — another operation, an event, or a service — which is how the wiring is seen to be alive.

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
  ui: true            # publish the UI
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

## The UI

The UI is published at `/.introspection`, on the hosts the context declares:

```yaml
# context.toa.yaml

ingress:
  hosts:
    - api.example.com
  class: alb
  annotations:
    alb.ingress.kubernetes.io/group.name: example
```

This section is what every service uses to reach the outside; without it the UI has nowhere to land
and `toa export` says so. To collect the map without publishing anything, set `ui: false`.

List the same hostnames Exposition serves — the page is static and reads the map from the API on its
own origin, so a host Exposition does not serve gives a page that cannot load anything.

Two services now share one host, which is a question for the ingress controller rather than for
Toa: ingress-nginx merges them, while AWS ALB needs `alb.ingress.kubernetes.io/group.name` on both.
The `annotations` above are applied to every service, which is the place to put it.

Reading the map still needs the `system:introspection` role. The page itself is served without
authentication — it is a page, and it displays nothing the API has not already granted.

### Developing the UI

The page is a Svelte application under `ui`, built into `ui/dist` — a directory of files the
explorer serves, with no server rendering and nothing to run beside it. The mount path is baked
into the bundle, because the ingress forwards it rather than rewriting it, and the client router
matches against it.

The build is git-ignored and produced on `npm publish`, so from a checkout it is a one-time step,
like `npm run transpile`:

```shell
$ npm run build:ui                  # in this package
```

The explorer then answers on port `8002`, and `/` redirects to the mount path, so a local run
opens at <http://localhost:8002>. To work on the page itself:

```shell
$ npm --prefix ui run dev           # http://localhost:5173/.introspection
```

Either way the API is the page's own origin — except on a local host, where the explorer and the
gateway are separate ports and the page asks `:8000` instead. Nothing configures this; see
`ui/src/config/index.ts`.

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

The explorer runs as the `introspection-explorer` service on port `8002`. It needs a database: the
components use the context's `mongodb` annotation like any other.

A port belongs to one service only — `toa export` refuses two claims on the same one, because
`toa mono` and a local run put every service in one process. Taken so far: `8000` by the exposition
gateway, `8001` by the telemetry readiness probe, `8002` here.
