# Toa Yaml

Wrapper for [js-yaml](https://github.com/nodeca/js-yaml).

`async load(path: string): object`

`sync(path: string): object`

Read an object from a YAML flie.

`all(path: string): object[]`

Read an array from a multi-document YAML file.

`async save(object: object, path: strgin): void`

Write an object to a YAML file.

`parse(input: string): object`

Parse a YAML document.

`split(input: string): object[]`

Parse a multi-document YAML.

`dump(input: object): string`

Serialize an object to a YAML document.

## YAML Keywords (non-standard)

### <assign

Load an object from the specified file and assign its properties to the current node recursively (
deep merge).

```yaml
<assign: <path>[#fragment]
```

- `path` Absolute or relative path to a file, or a glob pattern.
- `fragment` URL path to a source object (optional)

When using a pattern, all matched files will be processed sequentially.

#### Example

```yaml
# a.yaml
foo:
  bar: 1
```

```yaml
# b.yaml
qux: 'hello'
foo:
  baz: 2
```

```yaml
# c.yaml
<assign: '*.yaml'
```

## Environment variables

YAML documents can contain environment variable placeholders.

```yaml
foo: ${{ BAR }}
```
