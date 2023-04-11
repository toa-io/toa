# Toa Yaml

JavaScript parser and stringifier for YAML.

## yaml.load(path: string): object
Parse the data from a YAML file and convert it into JSON format.

## yaml.dump(input: object): string
Serializes object as a YAML document.

## yaml.parse(input: string): object
Parses string as single YAML document.

## yaml.split(path: string): object
Same as load(), but understands multi-document sources.

## yaml.save(file: string, data: object): object
Write the `data` to a `file` in YAML format.


# Additional YAML tags

## !import
This tag loads content from an external file and merges it with the current YAML.

```yaml
b: !import [path]
```
- `path` - can be specified as an absolute or relative path, or as a glob pattern.


### Example: for only one file

`imported.yaml`
```yaml
someB: a
```

`main.yaml`
```yaml
some: a
b: !import "imported.yaml"
```

`result`
```yaml
some: a
b:
  someB: a
```

### Example: for glob pattern

`a.schema.yaml`
```yaml
some1: a
```

`b.schema.yaml`
```yaml
some2: b
```

`main.yaml`
```yaml
some: a
b: !import "*.schema.yaml"
```

`result`
```yaml
some: a
b:
  some1: a
  some2: b
```
