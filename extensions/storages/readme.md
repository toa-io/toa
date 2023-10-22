# Toa Storages

Shared BLOB storage.

## Entry

BLOBs are stored with the meta-information object (Entry) having the following properties:

- `id` - checksum
- `type` - MIME type
- `hidden` - not included in the list of directory entries, default `false`
- `variants` - array of:
  - `name` - unique variant name
  - `type` - variant MIME type
- `meta` - object with application-specific information, empty by default

### Example

```yaml
id: eecd837c
type: image/jpeg
hidden: false
variants:
  - name: thumbnail.jpeg
    type: image/jpeg
  - name: thumbnail.webp
    type: image/webp
meta:
  face: true
  nudity: false
```

## Deduplication

BLOBs are stored in the storage system with their checksum as the key, ensuring that identical BLOBs
are stored only once.
Variants, on the other hand, are not deduplicated across different entries.

Underlying directory structure:

```
/temp
  c28f4dfd          # random id, auto deleted
/blobs
  b4f577e0          # checksum
/storage
  /path/to/b4f577e0
    .meta           # entry
    thumbnail.jpeg  # variant BLOBs
    thumbnail.webp
```

## Annotation

The `storages` context annotation is an object with keys that reference the storage name and
provider-specific URLs as values.

```yaml
storages:
  photos: s3://us-east-1/my-bucket
  photos@dev: file:///var/my-storage
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

`async put(path: string, stream: Readable, type?: string): Maybe<Entry>`

Add a BLOB to the storage and create an entry under specified `path`.

BLOB type is identified
using [magick numbers](https://github.com/sindresorhus/file-type).
If the `type` argument is specified and does not match the BLOB type, then a `TYPE_MISMATCH` error
is returned.

If the entry already exists, it is returned, and its `hidden` property is set to `false`.

`async get(path: string): Maybe<Entry>`

Get an entry.

If the entry does not exist, a `NOT_FOUND` error is returned.

`async list(path: string): Maybe<Entry[]>`

List entries under the specified `path`.

If the path does not exist, a `NOT_FOUND` error is returned.

`async fork(path: string, name: string, stream: Readable, type?: string): Entry`

Add or replace a `name` variant of the entry specified by `path`.

The BLOB type is verified as in the `add` method.

`async fetch(path): Maybe<Readable>`

Fetch the BLOB specified by `path`. If the path does not exist, a `NOT_FOUND` error is returned.
A variant may be specified in the path, e.g., `/path/to/eecd837c.thumbnail.jpeg`.

`async annotate(path: string, key: string, value: any): void`

Set a `key` property in the `meta` of the entry specified by `path`.

## Providers

Storage uses underlying providers to store BLOBs and entries.

Custom providers are not supported.

### Amazon S3

Annotation value format is `s3://{region}/{bucket}`.

Requires secrets for the access key and secret key.
See [`toa conceal`](/runtime/cli/readme.md#conceal) for deployment
and [`toa env`](/runtime/cli/readme.md#env)
for local environment.

`s3://us-east-1/my-bucket`

### Filesystem

Annotation value format is `file://{path}`.

`file:///var/my-storage`

### Temporary

Filesystem using OS temporary directory.

Annotation value format is `tmp://{path}`.

`tmp:///my-storage`
