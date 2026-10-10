# Toa development kit

- [Stage](./stage): integration tests framework (Node.js)
- [Template](#template): the application `toa create` writes

See [example](./example).

## Template

[`toa create <name>`](/runtime/cli/readme.md#create) writes an application into an empty
directory. Running it takes [Docker](https://docs.docker.com/get-docker/), for the services it
connects to, and [PM2](https://pm2.keymetrics.io), which keeps its processes:

```shell
$ npm install -g pm2
```

```text
package.json
tsconfig.json
docker-compose.yaml
ecosystem.config.js
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

| File                  | Is                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context.toa.yaml`    | The Context: the application's name and where its infrastructure is. It is the least a Context holds.                                                          |
| `docker-compose.yaml` | RabbitMQ, MongoDB as a replica set of one, and Redis, on their conventional ports, with the credentials `toa env --dev` writes.                                |
| `ecosystem.config.js` | The two processes PM2 keeps: `sys`, what Toa serves beside an application — its gateway, configuration and introspection — and `app`, the components.          |
| `components/hello`    | A component with code and no state: `greet`, a computation, served at `GET /hello/`.                                                                           |
| `components/notes`    | A component with state and no code: an entity, `create` forwarded to the operation every component inherits, served at `/notes/`.                              |
| `features`            | A scenario for each component, sent over HTTP. The steps start the components with the [stage](./stage), in the process of the test; `sys` is running already. |
| `package.json`        | The packages of Toa at the version that created the application, and the scripts below.                                                                        |
| `tsconfig.json`       | What `tsc` checks the components and the steps with.                                                                                                           |

| Script              | Runs                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm install`       | Installs the packages, then `toa npm`, which adds what the declarations require beyond them.              |
| `npm run dock`      | The services, and waits until they are ready.                                                             |
| `npm run env`       | `toa types`, `toa env --dev` and `toa map`. Run it again when a manifest or a component's source changes. |
| `npm run sys`       | `sys` alone: what the scenarios need, since they start the components themselves.                         |
| `npm run features`  | The scenarios.                                                                                            |
| `npm start`         | `sys` and `app`: the application, with its gateway on `http://localhost:8000`.                            |
| `npm run restart`   | `npm run env`, and both processes again.                                                                  |
| `npm stop`          | Stops and forgets both.                                                                                   |
| `npm run typecheck` | `tsc`.                                                                                                    |

`pm2 logs` shows what the processes write, and `pm2 ls` whether they run.

The routes are open to anyone, which is right for a first run and for nothing else.
