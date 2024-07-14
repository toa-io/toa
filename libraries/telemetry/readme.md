# Telemetry tools

## Console

Console provides methods `debug`, `info`, `warn`, and `error` to log messages with different
severity levels.

`(message: string, attributes?: object) => void`

Log entry format:

```yaml
time: string      # ISO 8601 timestamp
severity: string  # DEBUG, INFO, WARN, ERROR
message: string
attributes?: object
context: object   # context passed to the constructor
```

### Example

```javascript
const console = new Console({ context: 'my-app' })

console.info('Hello, world!', { foo: 'bar' })

/*
severity: info
context: my-app
time: 2020-01-01T00:00:00.000Z
message: Hello, world!
attributes:
  foo: bar
*/
```

```javascript
import { console } from 'openspan'

console.configure({ level: 'warn' })
console.info('ingnored')
```
