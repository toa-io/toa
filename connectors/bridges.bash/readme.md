# Bash bridge

Allows implementing operations in Bash.

Input must be an object which properties will be passed to the script as named arguments with values
converted to strings.
Output is a string being the standard output of the script.

If the script exits with a non-zero status code,
the operation will return an `Error` with the message being the standard error output of the script.

Operations cannot have access to the state or context. Basically,
only [computations](/documentation/design.md#special-types) are possible.

> While theoretically this bridge may find some use, it is mainly a demonstration of language
> interoperability.
