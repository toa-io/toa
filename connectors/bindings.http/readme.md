# Toa HTTP binding

Carries [streamed calls](/documentation/streams.md) — a call whose input holds a stream, which no
other binding can carry. It declines everything else, so ordinary calls, tasks, events and addressed
calls go over the binding beside it.

A call is made to a component, not to a process: whichever replica answers at the component's
address takes it.

## Annotation

An address per component, as the context has it:

```yaml
# context.toa.yaml
http:
  media.videos: http://media-videos:8005
```

Absent, a component is addressed at the `Service` deployment renders for it — its label, on port
`8005` — which is what a deployment normally leaves unsaid. What a key states is used for a
component and for the components under it: `.` is every component of the context.

A process reads the same map for the other side of it: it listens on the port in the address of each
component it serves. Where several components in one process name several ports, it listens on each.

Keys are folded by environment like every other key of a context, which is where a development
machine states the ports its processes take:

```yaml
http@local:
  media.videos: http://127.0.0.1:31006
  media.files: http://127.0.0.1:31007
```

Components composed in one process call each other without any of this: a stream is passed as it is
where there is nothing in between.
