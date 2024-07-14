# Telemetry

## Structured logs

Structured logs can be written using the `logs` Context Aspect, available without specific
declaration.

```javascript
async function computation (input, context) {
  context.logs.info('Hello, %s!', 'world', { foo: 'bar' })
}
```

Messages are formatted
using [`util.format`](https://nodejs.org/api/util.html#utilformatformat-args).
The last argument can be an object with additional attributes to be included in the log entry.

Logs are written to stdout or stderr and formatted as JSON objects. The log entry format is:

```yaml
time: string      # ISO 8601 timestamp
severity: string  # DEBUG, INFO, WARN, ERROR
message: string
attributes?: object
context:
  namespace: string
  component: string
  operation: string
```

### Logs configuration

Logs can be configured using `telemetry` Context Annotation.

- `severity`: limits the log level. It can be set to `debug`, `info` (default), `warn`, or `error`.

```yaml
# context.toa.yaml

telemetry:
  logs:
    severity: debug  # debug, info, warn, error
    severity@production: info
```

Logs configuration can be overridden for specific components or namespaces.

```yaml
# context.toa.yaml

telemetry:
  logs:
    severity: info
    identity.federation:
      severity: debug
    users.*:
      severity: warn
```

### Logs best practices

Use constant messages and attributes to facilitate log analysis.

:-1: Don't:

```javascript
context.logs.info(`User ${user.id} created`)
```

:+1: Do:

```javascript
context.logs.info('User created', { id: user.id })
```
