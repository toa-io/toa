# Cycle of Change

## TL;DR

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764528657645700&cot=14">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="4d-dark.png">
    <img alt="4D" width="400" height="455" src="4d-light.jpg">
  </picture>
</a>

- **Discussion**
    - Problem
    - Complexity
- **Documentation**
    - Manual
    - Scenarios
- **Decomposition**
    - Solution
    - Change Requests
- **Development**
    - Steps
    - Code

## Definition

Cycle of making changes consists of four mandatory straight forward steps[^1]: discussion,
documentation, decomposition and development.

Each iteration of the cycle starts with the *input*, which is a description of the customer needs,
provided in arbitrary form.

[^1]: Neither step may be skipped when going forward. Going backward is arbitrary.

## Discussion

Analyse the input to transform it into *correct*[^2], *consistent*[^3], *complete*[^4] and
*realizable*[^5] form, that is *strict* problem definition.

Discussion document should have the following sections:

<dl>
<dt>Abstract</dt>
<dd>
<i>Strict</i> abstract definition of <b>what</b> problem to be solved, and <b>how</b> it should be solved.
</dd>
<dt>Change Requests</dt>
<dd><i>Empty at this step.</i></dd>
<dt>Complexity</dt>
<dd>A number, which is abstract <a href="https://www.atlassian.com/agile/project-management/estimation">points estimation</a>.</dd>
<dt>Statements</dt>
<dd>List of <b>what is known</b>.</dd>
<dt>Questions</dt>
<dd>
List of <b>what is unknown</b>. At this step many of questions may don't have an answer.
</dd>
<dt>Options</dt>
<dd><i>Empty at this step.</i></dd>
</dl>

> While given sequence of sections ensures comfortable reading later, it will be most likely hard or
> impossible to create the document in such order.

[^2]: Does not conflict with the input.
[^3]: Does not conflict with itself.
[^4]: Contains enough information for next steps of the cycle.
[^5]: Able to be implemented.

## Documentation

Create the description from **end-user perspective**. Documentation must describe **how to use** the
feature yet to be implemented, not **how to implement** it.

Documentation step consists of two sequential processes: writing the user manual and scenarios.

### User Manual

Create or update User Manual. Form of this documentation part depends on type of software being
developed. In can be end-user manual, public API reference, interface of the library, etc.

### Scenarios

#### Write

Using the manual, describe expected software behaviour in
a [semi-formal format](https://en.wikipedia.org/wiki/Behavior-driven_development#Behavioral_specifications)
as a complete set of scenarios, using first-person narrative.

> ![!](https://img.shields.io/badge/!-red)<br/>
> Ensure completeness of the set of scenarios as it is the iteration completion criteria.

At this point behaviour tests either failing or not executable due to missing implementation of new
steps.

> Failing or not executable behaviour tests are not the reason not to
> [commit](development.md#commits). Actually, failing behaviour tests is a permanent state of any
> feature branch until the iteration is completed.

## Decomposition

Find and describe the solution of the problem. As the result of decomposition discussion document
must be updated with:

- answers to all **questions**, and some answers should have become statements
- a list of considered **options**, starting with selected one and containing description of the
  selection criteria
- a list of **change requests**

### Change Requests

List of changes to be made at the most top-level available in the software being developed. Each
item basically should be the message for the future commit or pull request conforming the existent
commit message convention.

Example: `feat(cli): add option -e to toa export command`

## Development

### Implement Steps

Add missing step implementations until all new behaviour tests are executable and failing.

> ![!](https://img.shields.io/badge/!-red)<br/>
> Behaviour steps are programs, thus must be composed
> of [developer's units of work](development.md#unit-of-work).

### Write the Code

Add the implementation in compliance with the solution described in the discussion document until
behaviour tests are *green* and the feature branch is closed according to existent flow.

See [development requirements](development.md).
