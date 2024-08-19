# Toa Storages

Shared BLOB storage.

## Entry

BLOBs are stored with the meta-information object (Entry) having the following properties:

- `size`: size in bytes
- `type`: MIME type
- `checksum`: content checksum
- `created`: creation timestamp (ISO 8601)
- `attributes`: `Record<string, string>` with application-specific information, empty by default

### Example

```yaml
id: eecd837c
type: image/jpeg
created: 1698004822358
attributes:
  face: true
  nudity: false
```

## Aspect

The Storages extension provides `storages` aspect,
containing named Storage instances, according to the annotation.

```javascript
async function effect (_, context) {
  await context.storages.photos.get('/path/to/b4f577e0.thumbnail.jpeg')
}
```

### Storage interface

> `Maybe<T> = T | Error`

#### `async put(path: string, stream: Readable, options?: Options): Maybe<Entry>`

```
interface Options {
  claim?: string
  accept?: string
  attributes?: Record<string, string>
}
```

Add a BLOB to the storage and create an entry under specified `path`, with given meta-information.

BLOB type is identified
using [magick numbers](https://github.com/sindresorhus/file-type).

If the `type` argument is specified and the value of the `claim` does not match the detected BLOB
type, then a `TYPE_MISMATCH` error is returned.
If the BLOB type cannot be identified and the value of the `claim` is not in the list of known
types, then the given value is used.
If the list of [acceptable types](https://datatracker.ietf.org/doc/html/rfc2616#section-14.1) is
passed and the type of the BLOB does not match any of its values, then a `NOT_ACCEPTABLE` error is
returned.

Known types
are: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/jxl`, `image/avif`.

See [source](source/Scanner.ts).

#### `async head(path: string): Maybe<Entry>`

Get an entry.

If the entry does not exist, a `NOT_FOUND` error is returned.

#### `async get(path: string): Maybe<Readable>`

Fetch the BLOB specified by `path`. If the path does not exist, a `NOT_FOUND` error is returned.

`path` can be an entry id, or a path to the entry, or a path to a variant of the entry.

- `eecd837c` - fetch the BLOB by `id`
- `/path/to/eecd837c` - fetch the BLOB by path
- `/path/to/eecd837c.thumbnail.jpeg` - fetch the `thumbnail.jpeg` variant of the BLOB

#### `async delete(path: string): Maybe<void>`

Delete the entry specified by `path`.

#### `async move(path: string, to: string): Maybe<void>`

Moves the entry specified by `path` to the new path.

`to` may be an absolute or relative path (starting with `.`), if it ends with `/`, the entry is
moved to the `to` directory, otherwise, the entry is moved to the `to` path.

The following examples are equivalent:

```javascript
await storage.move('/path/to/eecd837c', '/path/to/sub/eecd837c')
await storage.move('/path/to/eecd837c', './sub/eecd837c')
await storage.move('/path/to/eecd837c', './sub/')
```

## Providers

Storage uses underlying providers to store BLOBs and entries.

Custom providers are not supported.

### Amazon S3

Annotation formats are like:

```yaml
storages:
  photos:
    provider: s3
    bucket: my-bucket
    region: eu-west-1
  tmp:
    provider: s3
    endpoint: http://localhost:9000
    bucket: my-bucket
```

Secrets for the AWS access key and secret key can be provided via SECRETS constructs property. If
missed standard AWS SDK credentials resolve chain will be used (that means environment variable,
shared config file, EC2 metadata service, etc.).
See [`toa conceal`](/runtime/cli/readme.md#conceal) for deployment
and [`toa env`](/runtime/cli/readme.md#env)
for local environment.
`endpoint` parameter is optional.

### Cloudinary

[Cloudinary](https://cloudinary.com) provider is used to store and transform media files.

Stored media can be fetched in different formats and sizes by adding transformations to the path.

```
/path/to/eecd837c.100x100.jpeg    # crop
/path/to/eecd837c.100x.webp       # format jpeg or webp
/path/to/eecd837c.128x128z50.webp # zoom
/path/to/eecd837c.[128x128].webp  # resize inside the box
```

Annotation format is:

```yaml
storages:
  media:
    provider: cloudinary
    environment: my-cloud
    type: image # image or video
    prefix: my-app
```

Secrets:

- `API_KEY`
- `API_SECRET`

### Filesystem

Annotation format is:

```yaml
storages:
  photos:
    provider: fs
    path: /var/my-photos
```

[Kubernetes PVC](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) can be mounted to
the storage:

```yaml
storages:
  photos:
    provider: fs
    path: /var/my-photos
    claim: photos-pvc
```

### Temporary

Filesystem using OS temporary directory.

Annotation format is:

```yaml
storages:
  photos@dev:
    provider: tmp
    directory: my-app-tmp
```

### Memory

In-memory non-persistent storage.

Annotation value format is:

```yaml
storages:
  photos@dev:
    provider: mem
```

## Deduplication

BLOBs are stored in the underlying storage with their checksum as the key, ensuring that identical
BLOBs are stored only once.
Variants, on the other hand, are not deduplicated across different entries.

Underlying directory structure:

```
/temp
  c28f4dfd            # random id
/blobs
  b4f577e0            # checksum
/storage
  /path/to
    /.entries/
      b4f577e0        # entry
    /b4f577e0
      thumbnail.jpeg  # variant
      thumbnail.webp
```

## Manifest

Storage extension can be enabled by adding `storages` key to the component manifest.

```yaml
storages: [photos, videos]
```

Value of the `storages` key is an array of storage names, that should be declared in the context.

It the names are unknown, `null` declaration can be used:

```yaml
storages: ~
```

## Annotation

The `storages` context annotation is an object with keys that reference the storage name and
provider-specific URLs as values.

```yaml
storages:
  photos:
    provider: s3
    bucket: my-bucket
  photos@dev:
    provider: fs
    path: /var/my-storage
  tmp:
    provider: s3
    endpoint: http://localhost:9000
    bucket: my-bucket
```

## Secrets

Secrets declared by storage providers can be deployed
by [`toa conceal`](/runtime/cli/readme.md#conceal),
or set locally by [`toa env`](/runtime/cli/readme.md#env).
