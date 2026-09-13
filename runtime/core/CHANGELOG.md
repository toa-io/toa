# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.304](https://github.com/toa-io/toa/compare/v1.0.0-alpha.303...v1.0.0-alpha.304) (2026-09-13)

### Bug Fixes

* **core:** recognise an encoded reply whichever copy of the package made it ([643f048](https://github.com/toa-io/toa/commit/643f048784f7dc04db57194a2c64ebc148234951))

### Performance Improvements

* **core:** make an invocation's call counter where the first call is made ([894b1e5](https://github.com/toa-io/toa/commit/894b1e5c64e880e7ba7e53cf53d9a43ebde936ad))


# [1.0.0-alpha.303](https://github.com/toa-io/toa/compare/v1.0.0-alpha.302...v1.0.0-alpha.303) (2026-09-12)

### Features

* **core:** carry an output encoded for a caller that reads bytes ([38fdb32](https://github.com/toa-io/toa/commit/38fdb3234dee1ad83f755379f39eeab5708a29d1))
* **core:** measure operations and calls ([0d98e48](https://github.com/toa-io/toa/commit/0d98e480f38058ac0466de8b150951abe0254f2a))
* **core:** read a projection for an observation and refuse it to every other type ([e38c926](https://github.com/toa-io/toa/commit/e38c926ce0a7149aa8b618845e48042ffd1e7eb6))
* **core:** restrict an operation's output to what its request asks for ([532b08e](https://github.com/toa-io/toa/commit/532b08e388d2fcee54c367d344aeb74524ecf6c4))
* **metrics:** count what no span reaches ([efabf89](https://github.com/toa-io/toa/commit/efabf89e78f98a604bb939f476a937fc9ee106b3))
* **telemetry:** let a component declare its own metrics ([05aa3c7](https://github.com/toa-io/toa/commit/05aa3c72cd6a160e1cef99df6176a7f627075bc0))

### Performance Improvements

* **core:** derive a call identity with node:crypto from a parsed namespace ([7591600](https://github.com/toa-io/toa/commit/75916009409e4ae446d70d4ecbcc5af3972ec941))
* **core:** read TOA_ENV when an operation is created ([c56d6b7](https://github.com/toa-io/toa/commit/c56d6b7e7d70b179c0d7473a22ee2f1e8c44b5fe))


# [1.0.0-alpha.302](https://github.com/toa-io/toa/compare/v1.0.0-alpha.301...v1.0.0-alpha.302) (2026-09-11)

### Features

* **boot:** a run command may wait until the component is served ([0f66bed](https://github.com/toa-io/toa/commit/0f66bedf7b54dc9c1397f7f32bbccbffde7288ca))


# [1.0.0-alpha.301](https://github.com/toa-io/toa/compare/v1.0.0-alpha.300...v1.0.0-alpha.301) (2026-09-11)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.300](https://github.com/toa-io/toa/compare/v1.0.0-alpha.299...v1.0.0-alpha.300) (2026-09-11)

* feat(boot)!: a process is a thing, and an extension may keep something in one ([528d6cd](https://github.com/toa-io/toa/commit/528d6cdd307b45a6c30b6a184d7e06b3328cecf8))
* feat(core)!: an operation may ask to run once ([dca616c](https://github.com/toa-io/toa/commit/dca616cb380a7a389e277875d3bd5ca55a6e4d45))

### Bug Fixes

* **core:** a caller that stops waiting is answered at once, and its call is made nowhere ([c96880a](https://github.com/toa-io/toa/commit/c96880a39adc288153816ff54213bbb71fc96d48))
* **core:** a lookup and a failed publication say what became of them ([47b924b](https://github.com/toa-io/toa/commit/47b924b02f002ace14698365823df92f5379c537))

### Features

* **core:** a call carries what it is, and a chain of them carries it down ([ebd7769](https://github.com/toa-io/toa/commit/ebd776984a79adb9bf4a97b680128be1efab856f))
* **core:** a call may name the process it goes to, and wait for a set time ([7d8adb2](https://github.com/toa-io/toa/commit/7d8adb2772a95ff45ae5374efdedfb5a857fbbe9))
* **core:** a connector says whether it has been disposed of ([5db7c49](https://github.com/toa-io/toa/commit/5db7c497df3c10310f1efaa178b9201d4dcba7a0))
* **core:** an assignment may ask to run once as well ([10fbcbd](https://github.com/toa-io/toa/commit/10fbcbd86a5e82960e65f62c09d0a465ae8d0353))
* **exposition:** a client's idempotency key is what the call is ([3092028](https://github.com/toa-io/toa/commit/3092028df2803183c7e0ab08a7e89de25b36151b))

### BREAKING CHANGES

* `Storage.store`, `.upsert` and `.ensure` take one more
  argument, and `Storage` has two more members. A connector that ignores them
  works exactly as it did; a component that asks it for `once` is refused at
  boot. See migrations/299.md.
* a composition booted directly has no readiness probe. Readiness is
  the process's, and a composition is not a process. `stage.workload` boots one where a
  suite needs it.


# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

* feat(core)!: an endpoint a component does not provide is refused with a code ([6cabf9c](https://github.com/toa-io/toa/commit/6cabf9ccef9353f19a727888c667f5059c1ad2b5))

### Bug Fixes

* **cadence:** a delayed call is settled by its outcome, not by the attempt ([ac1c54b](https://github.com/toa-io/toa/commit/ac1c54b878e2705d81ce8365cf2f13e1d5ce0e83))
* **core:** the chain's test imports what the endpoint code already did ([ca474c8](https://github.com/toa-io/toa/commit/ca474c845a4376b40aaba534979859114c1b89d9))
* **core:** what the pump publishes is a debug line ([a1f98e9](https://github.com/toa-io/toa/commit/a1f98e90dc1dd4f43124d4f221f62cfd4d9b202a))

### Features

* **bindings.amqp:** a binding carries a channel, addressed by label ([17cf178](https://github.com/toa-io/toa/commit/17cf1782d1c47d033c02f99947b766eb9d45df75))
* **convergence:** deployments of one context converge ([8a70343](https://github.com/toa-io/toa/commit/8a70343cf6953aab58d4a25bac215508ff8d9a37))
* **core:** a call carries the chain it came by, and a circle is refused ([fccc887](https://github.com/toa-io/toa/commit/fccc8875b4af0d8cec914291c95db1c99e4a6a3f))
* **core:** a chain crosses an event, and the circle it closes is refused ([abd6ee2](https://github.com/toa-io/toa/commit/abd6ee22718c23dfdbc0974b3beec4afe0934533))
* **core:** a component reads the region it runs in ([fadc335](https://github.com/toa-io/toa/commit/fadc335bca9e71e6f2f592fa3ee13783cd71642b))
* **core:** a record carries the region that wrote it ([13ed187](https://github.com/toa-io/toa/commit/13ed187604f06dec66feec2e26ccf9dae30bb048))
* **core:** an outbox row is published to destinations ([cfb77b4](https://github.com/toa-io/toa/commit/cfb77b4826ff0f9560769a0996981e143d6525af))
* **core:** an outbox that owns no lane says so ([1ad693c](https://github.com/toa-io/toa/commit/1ad693cf5e2a6e2451e23e8c6d07831957ca150b))
* **core:** every system property is required ([52c468a](https://github.com/toa-io/toa/commit/52c468aacb03d0347a0e044f6bd76677bdd6af36))

### BREAKING CHANGES

* invoking an endpoint a component does not provide rejects with
  `EndpointException` (code 402) rather than an `AssertionError`.


# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/core
