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

# Keywords

Keywords are used as object keys; that is, they can only be applied to the objects they belong to (*target objects*).

## <assign

Assign properties of a source object to a target.

The source object may be a part of the current document, an external file or its part, or a set of files or their parts.
Parts of the document are references using JSONPath.

### Example

```yaml
# source.yaml
greeting:
  hello: world
```

```yaml
# target.yaml
foo:
  bar: baz
<assign: $.foo ./source.yaml source.yaml#$.greeting
```

An object, loaded from `target.yaml` will look like:

```yaml
foo:
  bar: baz
bar: baz        # assigned by $.foo
greeting: # assigned by ./source.yaml
  hello: world
hello: world    # assigned by source.yaml#$.greeting
```

Paths can be specified as an absolute or relative path, or as a glob pattern.
