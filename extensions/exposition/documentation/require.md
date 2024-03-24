# Directive family Require

The `require` directive family provides the ability to specify HTTP request requirements to be met.

## Headers

`require:header` requires a specific header to be present in the request, and `require:headers`
requires a set of headers to be present.

```yaml
exposition:
  /:id:
    require:header: if-match # enforce concurrency control
    PUT: transit
```
