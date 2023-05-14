# Developer notes

## Extending Replay

1. Update [`example`](../example). `toa replay` should either fail or throw exception.
2. Add [feature](/features). It should fail.
3. If the new decorator is being developed:
    1. Add the [decorator](/extensions/sampling/docs/replay.md).
    2. Add [boot extension](/runtime/boot/src/extensions).
4. Update `suite` [translation](./src/.suite/.component/translate.js).
5. Ensure the feature is passing.
6. Ensure example is passing with `toa replay`.
