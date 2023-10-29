# Octets

The `octets` directive family implements operations with BLOBs, using the [Storages extention](/extensions/storages).
The most common use case is to handle file uploads, downloads, and processing.

## `octets:storage`

Sets the [storage name](/extensions/storages/readme.md#annotation) to be used for the `octets` directives under the
current
RTD Node.

```yaml
/images:
  octets:storage: images
```

## `octets:store`

Stores the content of the request body into a storage, under the request path with specified `content-type`.

If request's `content-type` is not acceptable, or if the request body does not pass
the [validation](/extensions/storages/readme.md#async-putpath-string-stream-readable-type-string-maybeentry), the
request is rejected with a `415 Unsupported Media Type` response.

The value of the directive is an object with the following properties:

- `accept`: a media type or an array of media types that are acceptable. If the `accept` property is not specified,
  any media type is acceptable (which is the default).
- `workflow`: [workflow](#workflows) to be executed once the content is successfully stored.

```yaml
/images:
  octets:storage: images
  POST:
    octets:store:
      accept:
        - image/jpeg
        - image/png
        - video/*
      workflow:
        resize: images.resize
        analyze: images.analyze
```

### Workflows

A workflow is a list of endpoints to be called.
The following input will be passed to each endpoint:

```yaml
path: string
entry: Entry
```

See [Entry](/extensions/storages/readme.md#entry).

A _workflow unit_ is an object with keys referencing the workflow step identifier, and an endpoint as value.
Steps within a workflow unit are executed in parallel.

```yaml
octets:store:
  workflow:
    resize: images.resize
    analyze: images.analyze
```

A workflow can be a single unit, or an array of units. If it's an array, the workflow units are executed in sequence.

```yaml
octets:store:
  workflow:
    - optimize: images.optimize   # executed first
    - resize: images.resize       # executed second
      analyze: images.analyze     # executed in parallel with `resize`
```

If one of the workflow units returns an error, the execution of the workflow is interrupted.

### Response

The response of the `octets:store` directive is the created Entry.

```
201 Created
content-type: application/yaml

id: eecd837c
type: image/jpeg
created: 1698004822358
```

If the `octets:store` directive contains a `workflow`, the response is a stream. The first chunk represents the created
Entry, while subsequent chunks contain results from the workflow endpoints.

In case a workflow endpoint returns an error, the error chunk is sent to the stream, and the stream is closed.
Error's properties are added to the error chunk, among with the `step` identifier.

```
201 Created
content-type: application/yaml
transfer-encoding: chunked

id: eecd837c
type: image/jpeg
created: 1698004822358

optimize: null

error:
  step: resize
  code: TOO_SMALL
  message: Image is too small
```

## `octets:fetch`

Fetches the content of a stored BLOB corresponding to the request path, and returns it as the response body.

The value of the directive is an object with the following properties:

- `variants`: `boolean` indicating whether the
  [BLOB variant](/extensions/storages/readme.md#async-fetchpath-string-maybereadable) must be specified in the path.
  Defaults to `true`, which prevents the original BLOBs from being accessed.

```yaml
/images:
  octets:storage: images
  /*:
    GET:
      octets:fetch:
        variants: false  # allows accessing the original BLOBs
```

The `octets:fetch: ~` declaration is equivalent to defaults.

## `octets:list`

Lists the entries stored under the request path.

```yaml
/images:
  octets:storage: images
  GET:
    octets:list: ~
```

Responds with a list of entry identifiers.

## `octets:delete`

Deletes the entry corresponding to the request path.

```yaml
/images:
  octets:storage: images
  DELETE:
    octets:delete: ~
```

## `octets:permute`

Performs a [permutation](/extensions/storages/readme.md#async-permutepath-string-ids-string-maybevoid) on the entries
under the request path.

```yaml
/images:
  octets:storage: images
  PUT:
    octets:permute: ~
```

The request body must be a list of entry identifiers.

## `octets:entry`

Returns the entry corresponding to the request path.

```yaml
/images:
  octets:storage: images
  /*:
    OPTIONS:
      octets:entry: ~
```
