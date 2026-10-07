# Toa development kit

- [Stage](./stage): integration tests framework (Node.js)
- [Template](#template): the application `toa create` writes

See [example](./example).

## Template

[`toa create <name>`](/runtime/cli/readme.md#create) writes an application into an empty
directory:

```text
package.json
tsconfig.json
docker-compose.yaml
context.toa.yaml
cucumber.js
components/
  hello/
    manifest.toa.yaml
    operations/greet.ts
  notes/
    manifest.toa.yaml
features/
  hello.feature
  notes.feature
  steps/
    application.ts
    http.ts
```

| File | Is |
| --- | --- |
| `context.toa.yaml` | The Context: the application's name and where its infrastructure is. It is the least a Context holds. |
| `docker-compose.yaml` | RabbitMQ, MongoDB as a replica set of one, and Redis, on their conventional ports, with the credentials `toa env --dev` writes. |
| `components/hello` | A component with code and no state: `greet`, a computation, served at `GET /hello/`. |
| `components/notes` | A component with state and no code: an entity, `create` forwarded to the operation every component inherits, served at `/notes/`. |
| `features` | A scenario for each component, sent over HTTP to the application the steps start with the [stage](./stage). |
| `package.json` | The packages of Toa at the version that created the application, and the scripts below. |
| `tsconfig.json` | What `tsc` checks the components and the steps with. |

| Script | Runs |
| --- | --- |
| `npm run dock` | The services, and waits until they are ready. |
| `npm run env` | `toa types`, `toa env --dev` and `toa map`. Run it again when a manifest or a component's source changes. |
| `npm start` | The application in one process, with its gateway on `http://localhost:8000`. |
| `npm run features` | The scenarios. |
| `npm run typecheck` | `tsc`. |

The routes are open to anyone, which is right for a first run and for nothing else.
