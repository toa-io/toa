# Resource introspection

Any resource can be introspected by sending an `OPTIONS` request to the resource's path.
The response will contain the resource's input and output schemas for each supported method.

Introspection properties:

- `route` route parameters
- `query` query parameters
- `input` input schema
- `output` output schema
- `errors` error codes

```http
OPTIONS /pots/:id/ HTTP/1.1
accept: application/yaml
```

```http
200 OK
Allow: GET, POST, OPTIONS

GET:
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
