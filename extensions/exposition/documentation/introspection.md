# Resource introspection

Any resource can be introspected by sending an `OPTIONS` request to the resource's path.
The response will contain the resource's input and output schemas for each supported method.

```http
OPTIONS /pots/:id/ HTTP/1.1
accept: application/yaml
```

```http
200 OK
content-type: application/yaml

GET:
  output:
    type: object
    properties:
      id:
        type: string
        pattern: ^[0-9a-f]{32}$
      title:
        type: string
      volume:
        type: number
    required: [id, title]
    additionalProperties: false
PATCH:
  input:
    type: object
    properties:
      title:
        type: string
      volume:
        type: number
    required: [title, volume]
    additionalProperties: false
```
