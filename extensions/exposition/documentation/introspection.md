# Resource introspection

Any resource can be introspected by sending an `OPTIONS` request to the resource's path.

What it answers is what the route's directives leave of what the operation declared, for each
method the request may reach. A method it may not is not there, nor in `Allow`; a resource whose
every method it may not reach is `403`.

Introspection properties:

- `description` what the operation states it is
- `route` route parameters, including what `map:segments` names differently
- `query` query parameters
- `headers` properties `map:headers` reads from a request header, and which header
- `input` input schema, restricted by `io:input`, without what the gateway fills itself
- `output` output schema, restricted by `io:output`; absent where the reply is not sent at all
- `errors` error codes

```http
OPTIONS /pots/:id/ HTTP/1.1
accept: application/yaml
```

```http
200 OK
Allow: GET, POST

GET:
  description: Every pot there is.
  route:
    id:
      type: string
      pattern: ^[a-fA-F0-9]{32}$
  output:
    type: array
    items:
      type: object
      properties:
        title:
          type: string
          maxLength: 64
        volume:
          type: number
          exclusiveMinimum: 0
          maximum: 1000
        temperature:
          type: number
          exclusiveMinimum: 0
          maximum: 300
      additionalProperties: false
      required:
        - id
        - title
        - volume
POST:
  route:
    id:
      type: string
      pattern: ^[a-fA-F0-9]{32}$
  input:
    type: object
    properties:
      title:
        type: string
        maxLength: 64
      temperature:
        type: number
        exclusiveMinimum: 0
        maximum: 300
      volume:
        type: number
        exclusiveMinimum: 0
        maximum: 1000
    additionalProperties: false
    required:
      - title
      - volume
  output:
    type: object
    properties:
      id:
        type: string
        pattern: ^[a-fA-F0-9]{32}$
    additionalProperties: false
  errors:
    - NO_WAY
    - WONT_CREATE
```
