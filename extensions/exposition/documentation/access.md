# Access authorization

> The Authorization is intrinsically linked with the [Authentication](./identity.md).

## Directives

The Authorization is implemented as a set of [RTD Directives](../readme.md#directives).

Directives are executed in a predetermined order until one of them grants access to a resource. If none of the
directives grants access, then the Authorization interrupts request processing and responds with an authorization error.

### `anonymous`

Grants access if its value is `true` and the Identity is `null`, meaning that no credentials were provided.

### `id`

Grants access if resolved Identity matches the value of the URL path segment placeholder named after the directive's
value.

#### Example

Given the Route declaration and corresponding HTTP request:

```yaml
# context.toa.yaml

exposition:
  /users/:user-id:
    id: "user-id"
```

```http
GET /users/87480f2bd88048518c529d7957475ecd
Authorization: ...
```

For this request access will be granted if the resolved Identity value is `87480f2bd88048518c529d7957475ecd`.

### `role`

Grants access if resolved Identity has a role matching the directive's value or one of its values.

#### Example

```yaml
# context.toa.yaml

exposition:
  /code:
    role:
      - developer
      - reviewer
```

Access will be granted if the resolved Identity has a `developer` or `reviewer` role.

### `rule`

The Rule is a collection of other authorization directives. It allows access only if all the specified directives grant
access. The value of the `rule` directive can be a single Rule or a list of Rules.

#### Example

```yaml
# context.toa.yaml

exposition:
  /commits/:user-id:
    rule:
      id: user-id
      role: developer
```

## Roles

### Hierarchy

| Component        | Description                     |
|------------------|---------------------------------|
| `identity.roles` | Roles for the `role` Directive. |

