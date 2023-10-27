# Toa Storages

Shared BLOB storage.

## Entry

BLOBs are stored with the meta-information object (Entry) having the following properties:

- `id` - checksum
- `size` - size in bytes
- `type` - MIME type
- `created` - creation timestamp (UNIX time, ms)
- `variants` - array of:
  - `name` - unique name
  - `size` - size in bytes
  - `type` - variant MIME type
- `meta` - object with application-specific information, empty by default

### Example

```yaml
id: eecd837c
type: image/jpeg
created: 1698004822358
variants:
  - name: thumbnail.jpeg
    type: image/jpeg
  - name: thumbnail.webp
    type: image/webp
meta:
  face: true
  nudity: false
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
  await context.storages.photos.fetch('/path/to/b4f577e0.thumbnail.jpeg')
}
```

### Storage interface

> `Maybe<T> = T | Error`

#### `async put(path: string, stream: Readable, type?: string): Maybe<Entry>`

Add a BLOB to the storage and create an entry under specified `path`.

BLOB type is identified
using [magick numbers](https://github.com/sindresorhus/file-type).
If the `type` argument is specified and does not match the BLOB type, then a `TYPE_MISMATCH` error
is returned.
If the BLOB type cannot be identified
and the value of `type` is not in the list of known types, then the given value is used.

Known types
are: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/jxl`, `image/avif`.

See [source](source/Scanner.ts).

If the entry already exists, it is returned and [revealed](#async-revealpath-string-maybevoid).

#### `async get(path: string): Maybe<Entry>`

Get an entry.

If the entry does not exist, a `NOT_FOUND` error is returned.

#### `async fetch(path: string): Maybe<Readable>`

Fetch the BLOB specified by `path`. If the path does not exist, a `NOT_FOUND` error is returned.

`path` can be an entry id, or a path to the entry, or a path to a variant of the entry.

- `eecd837c` - fetch the BLOB by `id`
- `/path/to/eecd837c` - fetch the BLOB by path
- `/path/to/eecd837c.thumbnail.jpeg` - fetch the `thumbnail.jpeg` variant of the BLOB

#### `async delete(path: string): Maybe<void>`

Delete the entry specified by `path`.

#### `async list(path: string): string[]`

Get ordered list of `id`s of entries in under the `path`.

#### `async reorder(path: string, ids: string[]): Maybe<void>`

Reorder entries under the `path`.

Given list must be a permutation of the current list, otherwise a `PERMUTATION_MISMATCH` error is
returned.

#### `async diversify(path: string, name: string, stream: Readable): Maybe<void>`

Add or replace a `name` variant of the entry specified by `path`.

#### `async conceal(path: string): Maybe<void>`

Remove the entry from the list.

#### `async reveal(path: string): Maybe<void>`

Restore the entry to the list.

#### `async annotate(path: string, key: string, value: any): Maybe<void>`

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

Annotation value format is `file:///{path}`.

`file:///var/my-storage`

### Temporary

Filesystem using OS temporary directory.

Annotation value format is `tmp:///{path}`.

`tmp:///my-storage`

## Deduplication

BLOBs are stored in the underlying storage with their checksum as the key, ensuring that identical BLOBs
are stored only once.
Variants, on the other hand, are not deduplicated across different entries.

Underlying directory structure:

```
/temp
  c28f4dfd            # random id
/blobs
  b4f577e0            # checksum
/storage
  /path/to
    .list             # list of entries
    /b4f577e0
      .meta           # entry
      thumbnail.jpeg  # variant BLOBs
      thumbnail.webp
```
