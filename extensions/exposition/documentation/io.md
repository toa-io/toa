# I/O restrictions

The Exposition comes with `io` directives to control access to the operation's input and output
properties.

## `io:input`

The `io:input` optional directive contains a list of properties that are allowed to be specified in
the request body.

```yaml
POST:
  endpoint: create
  io:input: [name, location]
```

The list must be a valid subset of the operation's input properties.

If `io:input` is specified and the request body is not an object, or contains properties that are
not in the list, the request will be rejected with a `400` status code.

> Therefore, `io:input` is only applicable to operations which input is an object or an
> array of objects.

## `io:output`

The `io:output` mandatory directive contains a list of properties that are allowed to be included in
the response body.

```yaml
GET:
  endpoint: observe
  io:output: [name, location]
```

When an operation does not return an object (e.g., a primitive or a stream), or an object is dynamic
and its properties are not known in advance, `io:output` may have a value of `true` to disable
output restrictions.

```yaml
GET:
  endpoint: proxy
  io:output: true
```

If a method declaration lacks `io:output` directive, it will trigger a warning, and its
response will consistently be empty.
If this behavior is intended, a `false` value can be employed to suppress warnings.

```yaml
GET:
  endpoint: conceal
  io:output: false
```

Output restrictions are not applied to stream responses and errors.
