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


### Example

`a.yaml`
```yaml
foo:
  bar: 1
```

`b.yaml`
```yaml
qux: 'hello'
foo:
  baz: 2
```

`c.yaml`
```yaml
$import: ./*.yaml
```

`result`
```javascript
const value = yaml('c.yaml')

console.log(value)

/*
Outputs:

foo:
  bar: 1
  baz: 2
qux: 'hello'
*/
```

