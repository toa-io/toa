# Agent

Text-based HTTP client with variables and expressions.

## Function pipelines

- `id [length]`: generate UUID in hex format, truncated to a given length if provided.
- `email (@domain)`: generate email address with a given domain (default `@agent.test`).
- `password [length]`: generate password of a given length (default `16`).
- `basic [credentials]`: encode `credentials.username` and `credentials.password` to base64-encoded
  credentials.
  If `credentials` is omitted, generates a random username and password.
- `now [shift]`: result of `Date.now()`, optionally shifted by a given number of milliseconds.[^1]
- `utc`: current date (or the current pipeline value) in RFC 1123 format.
- `set (variable)`: set a variable to the current pipeline value.
- `print`: print the current pipeline value to the console.

```http
POST /identity/basic/ HTTP/1.1
host: the.one.com
accept: application/yaml
content-type: application/yaml

username: #{{ email @bubbas.net | set Bubba.username }}
password: #{{ password 8 | set Bubba.password }}
```

```http
GET / HTTP/1.1
host: the.one.com
authorization: Basic #{{ basic Bubba }}
```

### Custom functions

```typescript
import { Agent, Captures, type Functions } from '@toa.io/agent'

const functions: Functions = {
  duplicate: function(this: Captures, value: string, arg: string): string {
    return arg + arg
  },
  append: function(this: Captures, value: string, arg: string): string {
    return value + arg
  }
}

const captures = new Captures(functions)
const agent = new Agent('http://localhost:8000', captures)
```

```http request
PUT / HTTP/1.1
content-type: application/yaml

foo: #{{ duplicate bar | append baz }}
```

In the above example, `foo` will be set to `barbarbaz`.

[^1]: Also supports some human-readable values like `now -1d`, `now +1h`. Supported units
are `ms`, `s`, `sec`, `m`, `min`, `h`, `hr`, `hour`, `hours`, `d`, `day`, `days`.
