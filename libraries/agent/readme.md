# Agent

Text-based HTTP client with variables and pipelines.

## Pipelines

- `id`: generate UUID in hex format
- `password [length]`: generate password of a given length (default `12`)
- `basic (credentials)`: encode `credentials.username` and `credentials.password` to base64-encoded
  credentials
- `set (variable)`: set a variable to the current pipeline value

```http
POST /identity/basic/ HTTP/1.1
host: the.one.com
content-type: application/yaml
accept: application/yaml

username: #{{ id | set Bubba.username }}
password: #{{ password 8 | set Bubba.password }}
```

```http
GET / HTTP/1.1
host: the.one.com
authorization: Basic #{{ basic Bubba }}
```
