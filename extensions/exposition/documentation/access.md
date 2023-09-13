# Access authorization

> The Authorization is intrinsically linked with the [Authentication](./identity.md).

<a href="">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./.assets/ia3-dark.jpg">
    <img alt="IA3" width="600" height="507" src="./.assets/ia3-light.jpg">
  </picture>
</a>

## Directives

The Authorization is implemented as a set of [RTD Directives](tree.md#directives).

Directives are executed in a predetermined order until one of them grants access to a resource. If
none of the
directives grants access, then the Authorization interrupts request processing and responds with an
authorization error.

> The Authorization directive provider is named `authorization`,
> so the full names of the directives are `authorization:{directive}`.

### `anonymous`

Grants access if its value is `true` and no credentials were provided[^1].

[^1]: Credentials in the request make the
response [non-chachable](https://datatracker.ietf.org/doc/html/rfc7234#section-3).

### `id`

Grants access if resolved Identity matches the value of the URL path segment placeholder named after
the directive's value.

#### Example

Given the Route declaration and corresponding HTTP request:

```yaml
# context.toa.yaml

exposition:
  /users/:user-id:
    id: "user-id"
```

```http
GET /users/87480f2bd88048518c529d7957475ecd/
Authorization: ...
```

For this request access will be granted if the resolved Identity value
is `87480f2bd88048518c529d7957475ecd`.

### `role`

Grants access if resolved Identity has a role matching the directive's value or one of its values.

#### Example

```yaml
# context.toa.yaml

exposition:
  /code:
    role: [developer, reviewer]
```

Access will be granted if the resolved Identity has a role that matches `developer` or `reviewer`.

Read [Roles](#roles) section for more details.

### `rule`

The Rule is a collection of authorization directives. It allows access only if all the specified
directives grant
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

Access will be granted if an Identity matches a `user-id` placeholder and has a Role of `developer`.

## Roles

Role values are strings that can be assigned to an Identity and used for matching with values of
the [`role` directive](#role).

### Hierarchy

Role values are alphanumeric tokens separated by a colon (`:`).
Each token defines a Role Scope, forming a hierarchy.
A Role matches the value of the `rule` directive if that Role has the specified Scope in a
directive.

#### Example

```yaml
# context.toa.yaml

/exposition:
  /commits/:user-id:
    role: developer:senior
```

The example above defines a `role` directive with the specified `developer:senior` Role Scope.
This directive matches the roles `developer:senior` and `developer`,
but it **does not** match the Role `developer:senior:javascript`.
In other words, the Identity must have a specified or more general Role.

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764556008550471&cot=14">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".assets/role-scopes-dark.jpg">
    <img alt="IA3" width="600" height="425" src=".assets/role-scopes-light.jpg">
  </picture>
</a>


> The root-level Role Scope `system` is preserved and cannot be used with the `role` directives.

### Resources

Roles are persistent, so the Authorization includes `identity.roles` Component, that exposes the
following resources:

#### `/identity/roles/:id/`

<dl>
<dt><code>POST</code></dt>
<dd>Attach a role to an Identity. Request body is as follows:</dd>
</dl>

```yaml
role: string
```

<dl>
<dt><code>GET</code></dt>
<dd>Get a list of Roles, attached to an Identity.</dd>
<dt><code>PUT</code></dt>
<dd>Replace Roles attached to an Identity. Request body is as follows:</dd>
</dl>

```yaml
roles: [string]
```

#### `/identity/roles/:id/:role/`

<dl>
<dt><code>DELETE</code></dt>
<dd>Detach a Role from an Indetity.</dd>
</dl>

#### Authorization Directives

```yaml
/identity/roles/:id:
  role: system:roles
````

## Policies

Component Resource branches cannot have authorization directives.
Instead, they must declare Authorization Policies using `policy` directive to
be attached in the Context to a Resource Tree as a set of Authorization Directives
using `attachment` directive.

This restriction provides a separation of concerns, allowing components to be reused in different
Contexts with varying
access rules.

```yaml
# manifest.toa.yaml

name: posts

exposition:
  /:user-id:
    GET:
      endpoint: observe
      policy: read:list
    POST:
      endpoint: transit
      policy: post:submit
    /:post-id:
      GET:
        endpoint: observe
        policy: read:post
      PUT:
        endpoint: assign
        policy: post:edit
```

```yaml
# context.toa.yaml

exposition:
  /posts:
    attachment:
      read:
        anonymous: true
      post:
        id: user-id
      post:edit:
        role: app:posts:editor
```

Policy values as well as [Role](#roles) values define hierarchical Policy Scopes.

In the example above:

- an Attachment `read` attaches Directive `anonymous: true` to both `read:list` and `read:post`
  Policy Scopes.
  This means that a list of posts and each post can be accessed without authorization.
- an Attachment `post` attaches Directive `id: user-id` to both `post:submit` and `post:edit` Policy
  Scopes.
  This means that an Identity can submit and edit their own posts.
- an Attachment `post:edit` attaches Directive `role: app:posts:editor` to `post:edit` Policy Scope.
  This means that an identity with the role scope `app:posts:editor` can edit posts by any author,
  in addition to the fact that the author themselves can do this thanks to the previous Attachment.

### Nesting

Policies are namespace-scoped, meaning they can be attached to any Route under the
corresponding `/{namespace}` prefix.

Attachment is applied to the node where it is declared, as well as its nested nodes.
Directives of the Attachment are applied to the node where the attached Policies are declared, as
well as their nested nodes.

Here's an example of how this works:

```yaml
# manifest.toa.yaml

name: posts

exposition:
  /:user-id:
    GET:
      endpoint: observe
      policy: read
  /:user-id/:post-id:
    GET:
      endpoint: observe
      policy: read
```

```yaml
# context.toa.yaml

exposition:
  /posts:
    /:user-id:
      attachment:
        read:
          anonymous: true
    /:user-id/:post-id:
      attachment:
        read:
          role: reader
```

In the example above, the same Policy `read` is attached to two Routes with different Directives.

The following example demonstrates the attachment of the `read` Policy to both Routes with the same
Directive:

```yaml
# context.toa.yaml

exposition:
  /posts:
    attachment:
      read:
        anonymous: true
```
