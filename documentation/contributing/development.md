# Development Requirements

## Unit of Work

[TDD](https://en.wikipedia.org/wiki/Test-driven_development) is considered to be the way (but
not guarantee) to produce a *non-broken software*. Developer's unit of work is one completed
iteration of TDD cycle.

> *tl;dr-version*
> 1. If your tests are failing you must write code.
> 2. If your tests are passing you must write test, unless you're refactoring or done.

<a href="https://blog.cleancoder.com/uncle-bob/2014/12/17/TheCyclesOfTDD.html">
<img src="https://marcabraham.files.wordpress.com/2012/04/06_red_green_refactor.jpg" width="400" height="237" alt="Unit of Work">
</a>
&copy; <a href="https://blog.cleancoder.com/uncle-bob/2014/12/17/TheCyclesOfTDD.html">Bob</a>

## Flow

This project
follows [GitHub's standard forking model](https://guides.github.com/activities/forking/).

## Code Style Requirements [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

This project follows [JavaScript Standard Style](https://standardjs.com).

```shell
$ npm run lint
```

## Commits

### Commit Granularity

Small commits are [better](https://gitforteams.com/resources/commit-granularity.html) than big ones.

If you find yourself confused when you should commit changes, imagine you have a permanent question
from your boss: **What have you done?** Then, each time you have a reasonable answer to it, you
should commit. And that answer should be your commit message (conforming to the commit message
convention).

### Commit Messages [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg)](https://conventionalcommits.org)

Please use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

Commit subject line should complete the sentence:
> If applied, this commit will `[add your subject line here]`

### Clean Commits

A subject of a commit is a set of units of work, that is a set of **finished** TDD cycles, thus all
existent unit tests must pass and changed files must not contain TODOs (if you're not going to do it
now, create an issue).

> This project has a git [pre-commit hook](#) to help following this rule.

## See Also

- [Productivity Notes](productivity.md)
